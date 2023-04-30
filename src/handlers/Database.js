const mongoose = require('mongoose')
const uri = process.env.mongoIp

const { User } = require('./models/index')

const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
    // poolSize: 5,
    connectTimeoutMS: 10000,
    family: 4,
};

function init() {
    mongoose.connect(uri, dbOptions)

    mongoose.Promise = global.Promise;

    mongoose.connection.on('connected', () => {
        console.log('Mongoose has successfully connected!');
    });

    mongoose.connection.on('err', err => {
        console.log(`Mongoose connection error: \n${err.stack}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose connection lost');
    });


}

const mockData = {
    userId: "123456789",
    badge: "url",
    name: "text",
    badges: [{
        name: "text",
        badge: "url",
    }],
}

const connection = init()

const getConnection = () => connection
const getClient = () => client



async function create(dat) {
    const data = await User.findOne({ userId: dat.userId })
    if (data) return data;
    else return await new User(dat).save()
}

async function read(query) {
    const data = await User.findOne({ userId: query })
    if (data) return data;
    else return false;

}

async function del(query) {
    await User.findOneAndRemove({ userId: query })
    return true
}

async function delSingleGb(query, badgeName) {
    // delete the badge from badges array
    const userData = await User.findOne({ userId: query })
    const badges = userData.badges
    for (const badge of badges) {
        if (badge.name === badgeName) {
            badges.splice(badges.indexOf(badge), 1)
        }
    }
    userData.save()
    return true
}

async function migration() {
    const data = await User.find({})
    for (const user of data) {
        user.badges.push({
            name: user.name,
            badge: user.badge,
        })
        user.save()
    }
}

async function addBadge(query, oldBadgeName, newbadgeName, newbadgeUrl) {
    // add the badge to badges array
    const userData = await User.findOne({ userId: query })
    const badges = userData.badges
    // check if the badge already exists in the array and if it does replace it
    for (const badge of badges) {
        if (badge.name === oldBadgeName) {
            badge.name = newbadgeName
            badge.url = newbadgeUrl
        }
    }
    userData.save()
    return true
}

module.exports = { getConnection, getClient, create, read, del, delSingleGb, addBadge, migration }

if (require.main === module) {
    switch (process.argv[2]) {
        case "--read": case "-r":
            read(process.argv[3], process.argv[4]).then(res => { console.log(res); process.exit(1) });
            break;
        case "--create": case "-c":
            create(JSON.parse(process.argv[3])).then(res => { console.log(res); process.exit(1) });
            break;
        case "--delete": case "--del": case "-d":
            del(process.argv[3]).then(res => { console.log(res); process.exit(1) });
            break;
    }
}