cmake_minimum_required(VERSION 3.10)
project(RecommenderServer)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Server executable for the current POST/GET/PATCH/DELETE protocol.
add_executable(server
    src/main.cpp
    src/ClientSession.cpp
    src/CommandParser.cpp
    src/Persistence.cpp
    src/RecommendationEngine.cpp
    src/TcpServer.cpp
    src/User.cpp
    src/UserRepository.cpp
)

# Keep runtime binaries and test data in the build directory so integration tests
# can start ./server without modifying source files.
set_target_properties(server PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}"
)
file(MAKE_DIRECTORY "${CMAKE_BINARY_DIR}/data")

enable_testing()
add_subdirectory(tests)

add_custom_target(run_tests
    COMMAND ${CMAKE_CTEST_COMMAND} --test-dir ${CMAKE_BINARY_DIR} --output-on-failure
    DEPENDS server
    COMMENT "Running active C++ tests"
)
