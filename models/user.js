var bcrypt = require('bcryptjs');

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define('User', {
	firstName: { 
	    type: DataTypes.STRING, 
	    allowNull: false, 
	},
	lastName: {
	    type: DataTypes.STRING,
	    allowNull: false,
	},
	callsign: {
	    type: DataTypes.STRING,
	},
	phone: {
	    type: DataTypes.STRING,
	},
	email: { 
	    type: DataTypes.STRING, 
	    unique: true,
	    allowNull: false,
	    validate: { isEmail: { msg: 'Please enter a valid email address' } },
	},
	company: {
	    type: DataTypes.STRING,
	},
	token: {
	    type: DataTypes.STRING,
	    unique: true,

	    allowNull: false,
	},
	pass: {
	    type: DataTypes.STRING,
	    unique: true,
	},
	active: {
	    type: DataTypes.BOOLEAN,
	    defaultValue: false,
	}
    }, {
	instanceMethods: {
	    generateHash: function(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
	    },
	    validPassword: function(password) {
		return bcrypt.compareSync(password, this.pass);
            },
	},
	associate: function(models) {
	    User.hasMany(models.Role);
	    User.hasMany(models.Job);
	    User.hasMany(models.User, { as: 'Staff' });
	    User.hasMany(models.Position);
	    User.hasMany(models.Location);
	    User.hasMany(models.EventType);
	    User.hasMany(models.Client);
	}
    })
    return User
}
