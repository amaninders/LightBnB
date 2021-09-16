-- Show all reservations for a user.

SELECT properties.*, reservations.*, AVG(rating) AS average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1
AND end_date < Now()::Date
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10