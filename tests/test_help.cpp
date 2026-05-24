#include <cassert>
#include "../src/CommandParser.h"

void testHelpCommandParsing() {
    CommandParser parser;
    Command result = parser.parseCommand("help");
    
    assert(result.type == CommandType::Help);
}

void testHelpWithExtraArgumentsIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("help 123");
    
    assert(result.type == CommandType::Invalid);
}

void testHelpUppercaseIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand("HELP");
    
    assert(result.type == CommandType::Invalid);
}

void testHelpWithLeadingSpaceIsInvalid() {
    CommandParser parser;
    Command result = parser.parseCommand(" help");
    
    assert(result.type == CommandType::Invalid);
}

int main() {
    testHelpCommandParsing();
    testHelpWithExtraArgumentsIsInvalid();
    testHelpUppercaseIsInvalid();
    testHelpWithLeadingSpaceIsInvalid();
    
    return 0;
}