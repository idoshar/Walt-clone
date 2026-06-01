function isMissing(value){
    return value === undefined || value === null || value === '';
}

function validateRequiredFields(body, requiredFields){
    for(const field of requiredFields) {
        if(isMissing(body[field])){
            return `${field} is required`;
        }
    }

    return null;
}

function validateObject(body){
    if(!body || typeof body !== 'object' || Array.isArray(body)){
        return 'Request body must be a JSON object';
    }
    return null;
}
module.exports = {
    validateRequiredFields,
    validateObject
};