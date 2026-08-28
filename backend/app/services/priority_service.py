"""
Priority Scoring Service for Faculty Queue.

Computes priority scores for clearance requests based on:
- Exam date proximity (sooner = higher priority)
- Prerequisite completion ratio (more done = higher priority)
- Submission time (earlier = higher priority for tiebreaking)
- Department matching (same department = slight boost)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Student
from app.models.clearance import ClearanceEdge, ClearanceRequest


class PriorityService:
    """Service for computing priority scores for faculty queue."""

    # Weight constants for priority scoring
    EXAM_DATE_WEIGHT = 100.0      # Days until exam (0-100 scale)
    PREREQ_COMPLETION_WEIGHT = 50.0  # Prerequisite completion ratio (0-50 scale)
    SUBMISSION_TIME_WEIGHT = 10.0    # FIFO factor (0-10 scale)
    DEPARTMENT_MATCH_BONUS = 5.0     # Bonus for same department

    def __init__(self, session: AsyncSession):
        self.session = session
        self._prereq_cache: dict[str, list[str]] = {}

    async def _get_prerequisites(self, node_id: str) -> list[str]:
        """Get prerequisite node IDs for a given node (cached)."""
        if node_id not in self._prereq_cache:
            result = await self.session.execute(
                select(ClearanceEdge.from_node_id)
                .where(ClearanceEdge.to_node_id == node_id)
            )
            self._prereq_cache[node_id] = [str(r[0]) for r in result.all()]
        return self._prereq_cache[node_id]

    async def _get_completed_prereqs(self, student_account_id: str, prereq_ids: list[str]) -> int:
        """Count how many prerequisites are completed for a student."""
        if not prereq_ids:
            return 0

        result = await self.session.execute(
            select(ClearanceRequest.node_id)
            .where(
                ClearanceRequest.student_account_id == student_account_id,
                ClearanceRequest.node_id.in_(prereq_ids),
                ClearanceRequest.status == "approved",
            )
        )
        return len(result.all())

    def _calculate_exam_priority(self, exam_date: Optional[datetime]) -> float:
        """Calculate priority based on exam date proximity."""
        if not exam_date:
            return 0.0

        days_until = (exam_date - datetime.now()).days
        if days_until <= 0:
            return self.EXAM_DATE_WEIGHT  # Exam passed or today = max priority
        elif days_until <= 7:
            return self.EXAM_DATE_WEIGHT * 0.9
        elif days_until <= 14:
            return self.EXAM_DATE_WEIGHT * 0.7
        elif days_until <= 30:
            return self.EXAM_DATE_WEIGHT * 0.5
        else:
            return self.EXAM_DATE_WEIGHT * 0.2

    def _calculate_prereq_priority(self, done: int, total: int) -> float:
        """Calculate priority based on prerequisite completion ratio."""
        if total == 0:
            return self.PREREQ_COMPLETION_WEIGHT
        ratio = done / total
        return self.PREREQ_COMPLETION_WEIGHT * ratio

    def _calculate_submission_priority(self, submitted_at: datetime) -> float:
        """Calculate priority based on submission time (FIFO)."""
        # Normalize to 0-10 scale based on hours since submission
        hours_since = (datetime.now() - submitted_at).total_seconds() / 3600
        # Cap at 10 hours for max FIFO weight
        return min(self.SUBMISSION_TIME_WEIGHT, hours_since)

    async def compute_priority(
        self,
        request: ClearanceRequest,
        student: Student,
        faculty_department: Optional[str] = None,
    ) -> float:
        """
        Compute priority score for a clearance request.

        Args:
            request: The clearance request
            student: The student who made the request
            faculty_department: Optional department of the faculty (for matching bonus)

        Returns:
            Priority score (higher = more urgent)
        """
        # Get prerequisites for this node
        prereq_ids = await self._get_prerequisites(str(request.node_id))
        prereqs_total = len(prereq_ids)

        # Count completed prerequisites
        prereqs_done = await self._get_completed_prereqs(student.account_id, prereq_ids)

        # Calculate component scores
        exam_score = self._calculate_exam_priority(student.exam_date)
        prereq_score = self._calculate_prereq_priority(prereqs_done, prereqs_total)
        submission_score = self._calculate_submission_priority(request.submitted_at)

        # Department match bonus
        dept_bonus = 0.0
        if faculty_department and student.department.value == faculty_department:
            dept_bonus = self.DEPARTMENT_MATCH_BONUS

        total_score = exam_score + prereq_score + submission_score + dept_bonus
        return round(total_score, 2)

    async def compute_batch_priorities(
        self,
        requests: list[ClearanceRequest],
        students: dict[str, Student],
        faculty_department: Optional[str] = None,
    ) -> dict[str, float]:
        """
        Compute priorities for multiple requests efficiently.

        Args:
            requests: List of clearance requests
            students: Dict mapping student_account_id -> Student
            faculty_department: Optional department for matching bonus

        Returns:
            Dict mapping request.id -> priority_score
        """
        # Pre-fetch all prerequisites for all nodes in batch
        node_ids = list(set(str(r.node_id) for r in requests))
        self._prereq_cache = {}

        for node_id in node_ids:
            result = await self.session.execute(
                select(ClearanceEdge.from_node_id)
                .where(ClearanceEdge.to_node_id == node_id)
            )
            self._prereq_cache[node_id] = [str(r[0]) for r in result.all()]

        # Compute priorities
        priorities = {}
        for request in requests:
            student = students.get(str(request.student_account_id))
            if not student:
                priorities[str(request.id)] = 0.0
                continue

            prereq_ids = self._prereq_cache.get(str(request.node_id), [])
            prereqs_total = len(prereq_ids)

            # Count completed prerequisites
            prereqs_done = 0
            if prereq_ids:
                result = await self.session.execute(
                    select(ClearanceRequest.node_id)
                    .where(
                        ClearanceRequest.student_account_id == student.account_id,
                        ClearanceRequest.node_id.in_(prereq_ids),
                        ClearanceRequest.status == "approved",
                    )
                )
                prereqs_done = len(result.all())

            exam_score = self._calculate_exam_priority(student.exam_date)
            prereq_score = self._calculate_prereq_priority(prereqs_done, prereqs_total)
            submission_score = self._calculate_submission_priority(request.submitted_at)

            dept_bonus = 0.0
            if faculty_department and student.department.value == faculty_department:
                dept_bonus = self.DEPARTMENT_MATCH_BONUS

            priorities[str(request.id)] = round(
                exam_score + prereq_score + submission_score + dept_bonus, 2
            )

        return priorities