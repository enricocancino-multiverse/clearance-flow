/**
 * Pybind11 Python bindings for Kahn's Algorithm C++ Module
 *
 * Compile with:
 *   python -m pybind11 --includes
 *   g++ -O3 -shared -std=c++17 -fPIC \
 *     $(python3 -m pybind11 --includes) \
 *     kahn_algorithm.cpp kahn_binding.cpp \
 *     -o kahn_module$(python3-config --extension-suffix)
 *
 * Or use the setup.py for proper packaging.
 */

#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/chrono.h>

#include "kahn_algorithm.cpp"  // Include the implementation

namespace py = pybind11;

PYBIND11_MODULE(kahn_module, m) {
    m.doc() = "Kahn's Algorithm for Topological Sorting - ClearanceFlow C++ Module";

    py::class_<Node>(m, "Node")
        .def(py::init<>())
        .def_readwrite("id", &Node::id)
        .def_readwrite("label", &Node::label)
        .def_readwrite("office", &Node::office)
        .def_readwrite("position_x", &Node::position_x)
        .def_readwrite("position_y", &Node::position_y);

    py::class_<Edge>(m, "Edge")
        .def(py::init<>())
        .def_readwrite("from_node_id", &Edge::from_node_id)
        .def_readwrite("to_node_id", &Edge::to_node_id);

    py::class_<AlgorithmMetrics>(m, "AlgorithmMetrics")
        .def_readwrite("execution_time_ms", &AlgorithmMetrics::execution_time_ms)
        .def_readwrite("vertex_count", &AlgorithmMetrics::vertex_count)
        .def_readwrite("edge_count", &AlgorithmMetrics::edge_count)
        .def_readwrite("heap_usage_mb", &AlgorithmMetrics::heap_usage_mb)
        .def_readwrite("simulated_user_count", &AlgorithmMetrics::simulated_user_count)
        .def_readwrite("complexity", &AlgorithmMetrics::complexity);

    py::class_<TopologicalResult>(m, "TopologicalResult")
        .def_readwrite("sorted_node_ids", &TopologicalResult::sorted_node_ids)
        .def_readwrite("has_cycle", &TopologicalResult::has_cycle)
        .def_readwrite("metrics", &TopologicalResult::metrics);

    py::class_<KahnAlgorithm>(m, "KahnAlgorithm")
        .def(py::init<const std::vector<Node>&, const std::vector<Edge>&>())
        .def("execute", &KahnAlgorithm::execute, py::arg("simulated_users") = 100);
}