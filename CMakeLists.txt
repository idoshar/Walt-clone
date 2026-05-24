cmake_minimum_required(VERSION 3.10)
project(RecommenderServer)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Server executable
add_executable(server
    src/main.cpp
    src/ClientSession.cpp
    src/CommandParser.cpp
    src/Persistence.cpp
    src/RecommendationEngine.cpp
    src/RecommendCommandHandler.cpp
    src/TcpServer.cpp
    src/User.cpp
    src/UserRepository.cpp
)

add_subdirectory(tests)

# This runs ALL tests including unit tests, integration tests, and E2E tests
add_custom_target(run_tests
    COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure --verbose
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/tests
    COMMENT "Running all tests: unit tests, integration tests, and E2E tests"
)

#compile and run:
#cd build
#cmake ..
#make
#make run_tests