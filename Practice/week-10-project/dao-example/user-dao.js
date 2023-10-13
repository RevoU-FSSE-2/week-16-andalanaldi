class UserDao {

    constructor(db) {
        this.db = db
    }

    async findAll() {
        return this.db.collection('users').find({ is_deleted: { $exists: false }}).toArray()
    }

    async create({ username, email }) {
        return this.db.collection('users').insertOne({ username, email })
    }

    async update({ id, username, email}) {
        return this.db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: { username, email } })
    }

    async softDelete({ id }) {
        return this.db.collection('users').findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { is_deleted: true } })
      }
}