#include "Persistence.h"

#include <cctype>
#include <filesystem>
#include <fstream>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <vector>

static std::string trim(const std::string& text) {
    size_t start = 0;

    while (start < text.size() && std::isspace(static_cast<unsigned char>(text[start]))) {
        start++;
    }

    size_t end = text.size();

    while (end > start && std::isspace(static_cast<unsigned char>(text[end - 1]))) {
        end--;
    }

    return text.substr(start, end - start);
}

static bool parsePositiveInt(const std::string& text, int& value) {
    std::string trimmedText = trim(text);

    if (trimmedText.empty()) {
        return false;
    }

    for (char c : trimmedText) {
        if (!std::isdigit(static_cast<unsigned char>(c))) {
            return false;
        }
    }

    try {
        value = std::stoi(trimmedText);
    } catch (...) {
        return false;
    }

    return value > 0;
}

static bool parseProductsList(const std::string& text, std::vector<int>& productIds) {
    std::stringstream stream(text);
    std::string token;

    while (std::getline(stream, token, ',')) {
        int productId = 0;

        if (!parsePositiveInt(token, productId)) {
            return false;
        }

        productIds.push_back(productId);
    }

    return !productIds.empty();
}

void Persistence::save(const UserRepository& repository, const std::string& filePath) {
    std::filesystem::path path(filePath);

    if (path.has_parent_path()) {
        std::filesystem::create_directories(path.parent_path());
    }

    std::ofstream file(filePath);

    if (!file.is_open()) {
        return;
    }

    const std::map<int, User>& users = repository.getAllUsers();

    for (const auto& userEntry : users) {
        int userId = userEntry.first;
        const User& user = userEntry.second;
        std::set<int> products = user.getWatchedProducts();

        if (products.empty()) {
            continue;
        }

        file << userId << ":";

        bool firstProduct = true;

        for (int productId : products) {
            if (!firstProduct) {
                file << ",";
            }

            file << productId;
            firstProduct = false;
        }

        file << "\n";
    }
}

UserRepository Persistence::load(const std::string& filePath) {
    UserRepository repository;
    std::ifstream file(filePath);

    if (!file.is_open()) {
        return repository;
    }

    std::string line;

    while (std::getline(file, line)) {
        line = trim(line);

        if (line.empty()) {
            continue;
        }

        size_t colonPosition = line.find(':');

        if (colonPosition == std::string::npos) {
            continue;
        }

        std::string userIdText = line.substr(0, colonPosition);
        std::string productsText = line.substr(colonPosition + 1);

        int userId = 0;
        std::vector<int> productIds;

        if (!parsePositiveInt(userIdText, userId)) {
            continue;
        }

        if (!parseProductsList(productsText, productIds)) {
            continue;
        }

        repository.addWatchedProducts(userId, productIds);
    }

    return repository;
}
