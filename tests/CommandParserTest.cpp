#include <iostream>
#include "CommandParser.h"

/*It checks:
Parse input string
Identify add, recommend, help
Validate valid add
Validate valid recommend
Validate valid help
Detect invalid commands
Return a structured Command object
*/

void testAddValid()
{
    CommandParser parser;
    Command command = parser.parseCommand("add 1 100 101");

    if (command.type == CommandType::Add &&
        command.userId == 1 &&
        command.productIds.size() == 2 &&
        command.productIds[0] == 100 &&
        command.productIds[1] == 101)
    {
        std::cout << "PASS: testAddValid\n";
    }
    else
    {
        std::cout << "FAIL: testAddValid\n";
    }
}

void testRecommendValid()
{
    CommandParser parser;
    Command command = parser.parseCommand("recommend 1 104");

    if (command.type == CommandType::Recommend &&
        command.userId == 1 &&
        command.productIds.size() == 1 &&
        command.productIds[0] == 104)
    {
        std::cout << "PASS: testRecommendValid\n";
    }
    else
    {
        std::cout << "FAIL: testRecommendValid\n";
    }
}

void testHelpValid()
{
    CommandParser parser;
    Command command = parser.parseCommand("help");

    if (command.type == CommandType::Help)
    {
        std::cout << "PASS: testHelpValid\n";
    }
    else
    {
        std::cout << "FAIL: testHelpValid\n";
    }
}

void testInvalidCommand()
{
    CommandParser parser;
    Command command = parser.parseCommand("hello");

    if (command.type == CommandType::Invalid)
    {
        std::cout << "PASS: testInvalidCommand\n";
    }
    else
    {
        std::cout << "FAIL: testInvalidCommand\n";
    }
}

void testAddInvalid()
{
    CommandParser parser;
    Command command = parser.parseCommand("add");

    if (command.type == CommandType::Invalid)
    {
        std::cout << "PASS: testAddInvalid\n";
    }
    else
    {
        std::cout << "FAIL: testAddInvalid\n";
    }
}

void testRecommendInvalid()
{
    CommandParser parser;
    Command command = parser.parseCommand("recommend 1");

    if (command.type == CommandType::Invalid)
    {
        std::cout << "PASS: testRecommendInvalid\n";
    }
    else
    {
        std::cout << "FAIL: testRecommendInvalid\n";
    }
}



void testHelpInvalid()
{
    CommandParser parser;
    Command command = parser.parseCommand("help 1");

    if (command.type == CommandType::Invalid)
        std::cout << "PASS: testHelpInvalid\n";
    else
        std::cout << "FAIL: testHelpInvalid\n";
}

void testRecommendTooManyArguments()
{
    CommandParser parser;
    Command command = parser.parseCommand("recommend 1 104 105");

    if (command.type == CommandType::Invalid)
        std::cout << "PASS: testRecommendTooManyArguments\n";
    else
        std::cout << "FAIL: testRecommendTooManyArguments\n";
}

void testNonNumericInput()
{
    CommandParser parser;
    Command command = parser.parseCommand("add abc 100");

    if (command.type == CommandType::Invalid)
        std::cout << "PASS: testNonNumericInput\n";
    else
        std::cout << "FAIL: testNonNumericInput\n";
}

void testUppercaseCommand()
{
    CommandParser parser;
    Command command = parser.parseCommand("Add 1 100");

    if (command.type == CommandType::Invalid)
        std::cout << "PASS: testUppercaseCommand\n";
    else
        std::cout << "FAIL: testUppercaseCommand\n";
}

int main()
{
    testAddValid();
    testRecommendValid();
    testHelpValid();
    testInvalidCommand();
    testAddInvalid();
    testRecommendInvalid();
    testHelpInvalid();
    testRecommendTooManyArguments();
    testNonNumericInput();
    testUppercaseCommand();

    return 0;
}