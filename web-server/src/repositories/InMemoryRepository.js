class InMemoryRepository {
    constructor() {
        this._store = [];
        this._nextId = 1;
    }


    create(data) {
        const entity = { id: this._nextId++, ...data };
        this._store.push(entity);
        return entity;
    }


    findAll() {
        return [...this._store];
    }


    findById(id) {
        return this._store.find((e) => e.id === Number(id)) || null;
    }


    findOneBy(field, value) {
        return this._store.find((e) => e[field] === value) || null;
    }


    findWhere(predicate) {
        return this._store.filter(predicate);
    }

    update(id, updates) {
        const idx = this._store.findIndex((e) => e.id === Number(id));
        if (idx === -1) return null;

        // Prevent callers from accidentally overwriting the id.
        const { id: _ignored, ...safeUpdates } = updates;
        this._store[idx] = { ...this._store[idx], ...safeUpdates };
        return this._store[idx];
    }


    delete(id) {
        const idx = this._store.findIndex((e) => e.id === Number(id));
        if (idx === -1) return false;
        this._store.splice(idx, 1);
        return true;
    }


    count() {
        return this._store.length;
    }


    clear() {
        this._store = [];
        this._nextId = 1;
    }
}

module.exports = InMemoryRepository;
