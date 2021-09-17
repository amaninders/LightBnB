// require node-postgres
const { Pool } = require('pg');

// pool configuration
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
})


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
	return pool
  .query(`SELECT * FROM users WHERE email LIKE $1`, [`%${email}%`])
  .then(res => {
		if (!res.rows.length) {
			return null
		}
		return res.rows[0];
	})
  .catch(err => console.error('Error executing query', err.stack))
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
	return pool
  .query('SELECT * FROM users WHERE id = $1', [id])
  .then(res => {
		if (!res.rows.length) {
			return null
		}
		return res.rows[0];
	})
  .catch(err => console.error('Error executing query', err.stack))
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
	return pool
  .query('INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *;', [`${user.name}`, `${user.email}`, `${user.password}`])
  .then(res => {
		console.log(res);
		return res.rows
	})
  .catch(err => console.error('Error executing query', err.stack))
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
		.query(`SELECT properties.*, reservations.*, AVG(rating) AS average_rating
		FROM reservations
		JOIN properties ON reservations.property_id = properties.id
		JOIN property_reviews ON properties.id = property_reviews.property_id
		WHERE reservations.guest_id = $1
		AND end_date < Now()::Date
		GROUP BY properties.id, reservations.id
		ORDER BY reservations.start_date
		LIMIT $2`,[guest_id, limit])
		.then( result => {
			return result.rows
		})
		.catch( err =>	{
			return err.message
		});
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

 const getAllProperties = function(options, limit = 10) {
  
	// initialize the placholders for querystring and value
	const conditions = [];
	const values = [limit];
	let rating = ``;
	
	let string = `SELECT properties.*, AVG(rating) AS average_rating
	FROM properties
	JOIN property_reviews
	ON properties.id = property_reviews.property_id
	WHERE
	GROUP BY properties.id
	RATING
	ORDER BY cost_per_night
	LIMIT $1`
	
	let counter = 2;
	
	Object.keys(options).forEach((e) => {
		if (options[e]) {
			switch (e) {
				case 'city':
					values.push(`%${options[e]}%`);
					conditions.push(`${e} ILIKE $${counter++}`);
					break;
				case 'minimum_rating':
					values.push(parseInt(options[e]))
					rating = `HAVING AVG(rating) >= $${counter++}`;
					break;					
				case 'maximum_price_per_night':
					values.push(parseInt(options[e]) * 100)
					conditions.push(`cost_per_night < $${counter++}`);
					break;					
				case 'minimum_price_per_night':
					values.push(parseInt(options[e]) * 100)
					conditions.push(`cost_per_night > $${counter++}`);
					break;					
				default:
					values.push(parseInt(options[e]))
					conditions.push(`${e} = $${counter++}`);
					break;
			}
		}
	})
	
	
	string = string
		.replace('WHERE',        //replace conditions if applicable
			conditions.length 
			? `WHERE ${conditions.join(' AND ')}` 
			: ''
		)
		.replace('RATING',			//replace rating clause if applicable
			rating.length
			? rating
			: ''
		)

  return pool
		.query(string, values)
    .then(res => res.rows)
    .catch(err => err.stack);
}

 exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  
	// initialize constants and variables
	let string = `INSERT INTO properties(col_placeholder) VALUES(col_parameters) RETURNING*`;
	let counter = 1
	const colParameters = [];
	const values = []
	
	Object.keys(property).forEach(e => {
		colParameters.push(`$${counter++}`);
		values.push(property[e]);
	})
	
	queryString = string
						.replace('col_placeholder', Object.keys(property))
						.replace('col_parameters', colParameters);
	
	console.log(queryString);
	console.log(values);
	return pool
		.query(queryString, values)
		.then(res => {
			console.log(res);
			res.rows
		})
		.catch(err => err.stack);
}
exports.addProperty = addProperty;
