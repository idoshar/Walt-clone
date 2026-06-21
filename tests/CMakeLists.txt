# Active tests for the current POST/GET/PATCH/DELETE protocol.
# Legacy add/recommend tests remain in the repository for history only and are
# intentionally not configured as build targets.

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}")
set(TEST_WORKING_DIRECTORY "${CMAKE_BINARY_DIR}")

function(add_project_test target)
    add_test(NAME ${target} COMMAND $<TARGET_FILE:${target}>)
    set_tests_properties(${target} PROPERTIES
        WORKING_DIRECTORY "${TEST_WORKING_DIRECTORY}"
    )
endfunction()

# Command parser tests
add_executable(test_post test_post.cpp ../src/CommandParser.cpp)
add_executable(test_get test_get.cpp ../src/CommandParser.cpp)
add_executable(test_delete test_delete.cpp ../src/CommandParser.cpp)
add_executable(test_patch test_patch.cpp ../src/CommandParser.cpp)
add_executable(test_help test_help.cpp ../src/CommandParser.cpp)
add_executable(test_400 test_400.cpp ../src/CommandParser.cpp)

# Repository and persistence tests
add_executable(test_404 test_404.cpp ../src/UserRepository.cpp ../src/User.cpp)
add_executable(test_persistence
    test_persistence.cpp
    ../src/Persistence.cpp
    ../src/UserRepository.cpp
    ../src/User.cpp
)

add_project_test(test_post)
add_project_test(test_get)
add_project_test(test_delete)
add_project_test(test_patch)
add_project_test(test_help)
add_project_test(test_400)
add_project_test(test_404)
add_project_test(test_persistence)

# Socket integration tests require the POSIX socket APIs used by the server.
if(NOT WIN32)
    add_executable(test_multiple_commands
        integration/test_multiple_commands.cpp
        ../src/CommandParser.cpp
        ../src/RecommendationEngine.cpp
        ../src/UserRepository.cpp
        ../src/User.cpp
        ../src/Persistence.cpp
        ../src/TcpServer.cpp
        ../src/ClientSession.cpp
    )

    add_executable(test_full_scenario
        integration/test_full_scenario.cpp
        ../src/CommandParser.cpp
        ../src/RecommendationEngine.cpp
        ../src/UserRepository.cpp
        ../src/User.cpp
        ../src/Persistence.cpp
        ../src/TcpServer.cpp
        ../src/ClientSession.cpp
    )

    target_link_libraries(test_multiple_commands pthread)
    target_link_libraries(test_full_scenario pthread)

    add_project_test(test_multiple_commands)
    add_project_test(test_full_scenario)
endif()

find_package(Python3 COMPONENTS Interpreter)
if(Python3_Interpreter_FOUND AND NOT WIN32)
    add_test(
        NAME test_e2e
        COMMAND ${Python3_EXECUTABLE} ${CMAKE_CURRENT_SOURCE_DIR}/test_e2e.py
    )
    set_tests_properties(test_e2e PROPERTIES
        WORKING_DIRECTORY "${TEST_WORKING_DIRECTORY}"
    )
endif()

set_tests_properties(
    test_multiple_commands
    test_full_scenario
    test_e2e
    PROPERTIES RUN_SERIAL TRUE
)
