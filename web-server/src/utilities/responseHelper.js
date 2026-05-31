function ok(res, data){
    return res.status(200).json(data);
}

function created(res, location){
    res.set('Location', location);
    return res.status(201).send();
}

function noContent(res){
    return res.status(204).send();
}

function badRequest(res, message){
    return res.status(400).json({ error: message });
}

function notFound(res, message){
    return res.status(404).json({ error: message });
}
module.exports = {
    ok,
    created,
    noContent,
    badRequest,
    notFound
};