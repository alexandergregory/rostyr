module.exports = function(sequelize, DataTypes) {
  var Booking = sequelize.define('Booking', {
    start: {
        type:  DataTypes.STRING,
        allowNull: false
    },
    position: {
	type: DataTypes.STRING,
	allowNull: false
    }
  }, {
    associate: function(models) {
	Booking.belongsTo(models.Job);
    }
  })

  return Booking
}
