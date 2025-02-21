const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userId: String,
    badge: String,
    name: String,
    badges: [{
        name: String,
        badge: String,
    }],
})

module.exports = mongoose.model('User', userSchema);