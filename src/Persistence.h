#ifndef PERSISTENCE_H
#define PERSISTENCE_H

#include <string>

#include "UserRepository.h"

class Persistence {
public:
    static void save(const UserRepository& repository, const std::string& filePath);
    static UserRepository load(const std::string& filePath);
};

#endif
