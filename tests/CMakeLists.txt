cmake_minimum_required(VERSION 3.10)
project(RecommenderTests)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ========== OLD TESTS (DISABLED - kept for reference) ==========
# These tests use old commands (add, recommend) and are no longer active
# They are kept for historical purposes but NOT run by "make run_tests"

add_executable(test_add_OLD test_add.cpp ../src/User.cpp ../src/UserRepository.cpp)
add_executable(test_recommend_OLD test_recommend.cpp 
    ../src/CommandParser.cpp 
    ../src/RecommendationEngine.cpp 
    ../src/UserRepository.cpp 
    ../src/User.cpp
)
add_executable(test_parsing_OLD test_parsing.cpp ../src/CommandParser.cpp)
add_executable(test_ex2_parser_OLD test_ex2_parser.cpp ../src/CommandParser.cpp)
add_executable(test_ex2_repository_OLD test_ex2_repository.cpp 
    ../src/UserRepository.cpp 
    ../src/User.cpp
)
add_executable(CommandParserTest_OLD CommandParserTest.cpp ../src/CommandParser.cpp)

# ========== NEW TESTS (ACTIVE) ==========

# Unit tests - CommandParser based (new commands: POST, GET, DELETE, PATCH)
add_executable(test_post test_post.cpp ../src/CommandParser.cpp)
add_executable(test_get test_get.cpp ../src/CommandParser.cpp)
add_executable(test_delete test_delete.cpp ../src/CommandParser.cpp)
add_executable(test_patch test_patch.cpp ../src/CommandParser.cpp)
add_executable(test_help test_help.cpp ../src/CommandParser.cpp)
add_executable(test_400 test_400.cpp ../src/CommandParser.cpp)

# Unit tests - User/Repository based
add_executable(test_404 test_404.cpp ../src/UserRepository.cpp ../src/User.cpp)

# Unit tests - RecommendationEngine based (uses GET)
add_executable(test_adversarial_system 
    test_adversarial_system.cpp
    ../src/RecommendationEngine.cpp
    ../src/UserRepository.cpp
    ../src/User.cpp
)

add_executable(test_big_system 
    test_big_system.cpp
    ../src/RecommendationEngine.cpp
    ../src/UserRepository.cpp
    ../src/User.cpp
)

# Unit tests - Persistence based
add_executable(test_persistence 
    test_persistence.cpp 
    ../src/Persistence.cpp 
    ../src/UserRepository.cpp 
    ../src/User.cpp
)

# ========== INTEGRATION TESTS ==========

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

# Link Windows sockets for integration tests
if(WIN32)
    target_link_libraries(test_multiple_commands ws2_32)
    target_link_libraries(test_full_scenario ws2_32)
else()
    target_link_libraries(test_multiple_commands pthread)
    target_link_libraries(test_full_scenario pthread)
endif()

# ========== CTest ==========
enable_testing()

# ========== ACTIVE TESTS (run with "make run_tests") ==========
add_test(NAME test_post COMMAND test_post)
add_test(NAME test_get COMMAND test_get)
add_test(NAME test_delete COMMAND test_delete)
add_test(NAME test_patch COMMAND test_patch)
add_test(NAME test_help COMMAND test_help)
add_test(NAME test_400 COMMAND test_400)
add_test(NAME test_404 COMMAND test_404)
add_test(NAME test_adversarial_system COMMAND test_adversarial_system)
add_test(NAME test_big_system COMMAND test_big_system)
add_test(NAME test_persistence COMMAND test_persistence)
add_test(NAME test_multiple_commands COMMAND test_multiple_commands)
add_test(NAME test_full_scenario COMMAND test_full_scenario)
add_test(NAME test_e2e COMMAND python3 ${CMAKE_CURRENT_SOURCE_DIR}/test_e2e.py)

# ========== DISABLED TESTS (kept for reference, NOT run automatically) ==========
# These tests use old command names (add, recommend) and are disabled
# To run them manually: ctest -R OLD
add_test(NAME test_add_DISABLED COMMAND test_add_OLD)
add_test(NAME test_recommend_DISABLED COMMAND test_recommend_OLD)
add_test(NAME test_parsing_DISABLED COMMAND test_parsing_OLD)
add_test(NAME test_ex2_parser_DISABLED COMMAND test_ex2_parser_OLD)
add_test(NAME test_ex2_repository_DISABLED COMMAND test_ex2_repository_OLD)
add_test(NAME CommandParserTest_DISABLED COMMAND CommandParserTest_OLD)

# Mark disabled tests as SKIP so they don't fail the run
set_tests_properties(
    test_add_DISABLED
    test_recommend_DISABLED
    test_parsing_DISABLED
    test_ex2_parser_DISABLED
    test_ex2_repository_DISABLED
    CommandParserTest_DISABLED
    PROPERTIES WILL_FAIL FALSE
)