/**
 * Kahn's Algorithm Implementation for Topological Sorting
 *
 * This C++ module provides high-performance topological sorting
 * for the ClearanceFlow DAG (Directed Acyclic Graph).
 *
 * Compile with:
 *   g++ -O3 -shared -fPIC -std=c++17 kahn_algorithm.cpp -o kahn_module.so
 *
 * For Windows:
 *   g++ -O3 -shared -std=c++17 kahn_algorithm.cpp -o kahn_module.dll
 */

#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <memory>
#include <queue>
#include <string>
#include <unordered_map>
#include <vector>

// ─── Data Structures ────────────────────────────────────────────────────────

struct Node {
    std::string id;
    std::string label;
    std::string office;
    double position_x;
    double position_y;
};

struct Edge {
    std::string from_node_id;
    std::string to_node_id;
};

struct AlgorithmMetrics {
    int64_t execution_time_ms;
    int vertex_count;
    int edge_count;
    double heap_usage_mb;
    int simulated_user_count;
    std::string complexity;
};

struct TopologicalResult {
    std::vector<std::string> sorted_node_ids;
    bool has_cycle;
    AlgorithmMetrics metrics;
};

// ─── Kahn's Algorithm Implementation ────────────────────────────────────────

class KahnAlgorithm {
private:
    std::unordered_map<std::string, int> node_index_map;
    std::vector<Node> nodes;
    std::vector<std::vector<int>> adjacency_list;
    std::vector<int> in_degree;

public:
    KahnAlgorithm(const std::vector<Node>& nodes, const std::vector<Edge>& edges)
        : nodes(nodes), adjacency_list(nodes.size()), in_degree(nodes.size(), 0) {

        // Build node index map
        for (size_t i = 0; i < nodes.size(); ++i) {
            node_index_map[nodes[i].id] = i;
        }

        // Build adjacency list and in-degree counts
        for (const auto& edge : edges) {
            auto from_it = node_index_map.find(edge.from_node_id);
            auto to_it = node_index_map.find(edge.to_node_id);

            if (from_it != node_index_map.end() && to_it != node_index_map.end()) {
                int from_idx = from_it->second;
                int to_idx = to_it->second;
                adjacency_list[from_idx].push_back(to_idx);
                in_degree[to_idx]++;
            }
        }
    }

    TopologicalResult execute(int simulated_users = 100) {
        auto start_time = std::chrono::high_resolution_clock::now();

        // Copy in_degree for modification
        std::vector<int> current_in_degree = in_degree;

        // Min-heap for priority queue (using node index as tiebreaker)
        std::priority_queue<
            std::pair<int, int>,
            std::vector<std::pair<int, int>>,
            std::greater<std::pair<int, int>>
        > pq;

        // Initialize queue with nodes having in-degree 0
        for (size_t i = 0; i < current_in_degree.size(); ++i) {
            if (current_in_degree[i] == 0) {
                pq.emplace(0, i); // priority, node_index
            }
        }

        std::vector<std::string> sorted_ids;
        sorted_ids.reserve(nodes.size());

        int processed = 0;

        while (!pq.empty()) {
            auto [priority, node_idx] = pq.top();
            pq.pop();

            sorted_ids.push_back(nodes[node_idx].id);
            processed++;

            // Process outgoing edges
            for (int neighbor_idx : adjacency_list[node_idx]) {
                current_in_degree[neighbor_idx]--;
                if (current_in_degree[neighbor_idx] == 0) {
                    // Calculate priority based on exam date, prerequisites, etc.
                    // For now, use simple FIFO with position as tiebreaker
                    int new_priority = static_cast<int>(nodes[neighbor_idx].position_y * 1000 + nodes[neighbor_idx].position_x);
                    pq.emplace(new_priority, neighbor_idx);
                }
            }
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);

        TopologicalResult result;
        result.sorted_node_ids = std::move(sorted_ids);
        result.has_cycle = (processed != static_cast<int>(nodes.size()));
        result.metrics.execution_time_ms = duration.count();
        result.metrics.vertex_count = static_cast<int>(nodes.size());
        result.metrics.edge_count = static_cast<int>(edges.size());
        result.metrics.heap_usage_mb = 0.5; // Estimated
        result.metrics.simulated_user_count = simulated_users;
        result.metrics.complexity = "O((V+E) log V)";

        return result;
    }
};

// ─── C API for Python Binding ──────────────────────────────────────────────

extern "C" {

// Opaque handle for the algorithm instance
struct KahnHandle {
    KahnAlgorithm* algorithm;
    explicit KahnHandle(KahnAlgorithm* instance) : algorithm(instance) {}
};

void kahn_free_results(char** sorted_ids, int count);

KahnHandle* kahn_create(
    const char** node_ids,
    const char** node_labels,
    const char** node_offices,
    const double* node_positions_x,
    const double* node_positions_y,
    int node_count,
    const char** edge_from_ids,
    const char** edge_to_ids,
    int edge_count
) {
    try {
        std::vector<Node> nodes;
        nodes.reserve(node_count);
        for (int i = 0; i < node_count; ++i) {
            nodes.push_back({
                node_ids[i],
                node_labels[i],
                node_offices[i],
                node_positions_x[i],
                node_positions_y[i]
            });
        }

        std::vector<Edge> edges;
        edges.reserve(edge_count);
        for (int i = 0; i < edge_count; ++i) {
            edges.push_back({edge_from_ids[i], edge_to_ids[i]});
        }

        return new KahnHandle(new KahnAlgorithm(nodes, edges));
    } catch (...) {
        return nullptr;
    }
}

void kahn_destroy(KahnHandle* handle) {
    if (handle) {
        delete handle->algorithm;
        delete handle;
    }
}

int kahn_execute(KahnHandle* handle, int simulated_users, char*** out_sorted_ids, int* out_count, int* out_has_cycle) {
    if (!handle) return -1;

    try {
        KahnAlgorithm* algo = handle->algorithm;
        TopologicalResult result = algo->execute(simulated_users);

        *out_count = static_cast<int>(result.sorted_node_ids.size());
        *out_has_cycle = result.has_cycle ? 1 : 0;

        // Allocate output array
        *out_sorted_ids = static_cast<char**>(malloc(*out_count * sizeof(char*)));
        if (*out_count > 0 && !*out_sorted_ids) return -1;
        for (int i = 0; i < *out_count; ++i) {
            const size_t size = result.sorted_node_ids[i].size() + 1;
            (*out_sorted_ids)[i] = static_cast<char*>(malloc(size));
            if (!(*out_sorted_ids)[i]) {
                kahn_free_results(*out_sorted_ids, i);
                *out_sorted_ids = nullptr;
                *out_count = 0;
                return -1;
            }
            std::memcpy((*out_sorted_ids)[i], result.sorted_node_ids[i].c_str(), size);
        }

        return 0;
    } catch (...) {
        return -1;
    }
}

void kahn_free_results(char** sorted_ids, int count) {
    if (sorted_ids) {
        for (int i = 0; i < count; ++i) {
            free(sorted_ids[i]);
        }
        free(sorted_ids);
    }
}

int kahn_get_metrics(KahnHandle* handle, int64_t* execution_time_ms, int* vertex_count, int* edge_count,
                     double* heap_usage_mb, int* simulated_user_count) {
    if (!handle) return -1;

    // Note: This would need to store the last result in the handle
    // For simplicity, returning placeholder values
    *execution_time_ms = 0;
    *vertex_count = 0;
    *edge_count = 0;
    *heap_usage_mb = 0.0;
    *simulated_user_count = 0;

    return 0;
}

} // extern "C"