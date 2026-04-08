// Generate a random username
function generateUsername() {
	const characters = [
		'Levi', 'Goku', 'Lelouch', 'Itachi', 'Naruto', 'Saitama', 'Deadpool', 'Wolverine',
		'Eren', 'Zoro', 'Lightning', 'Cloud', 'Aerith', 'Jinx', 'Vi', 'Geralt', 'Ciri',
		'Dante', 'Vergil', 'Tanjiro', 'Nezuko', 'Zenitsu', 'Gojo', 'Sukuna', 'Megumi',
		'Luffy', 'Sanji', 'Ichigo', 'Rukia', 'Batman', 'Joker', 'Neo', 'Trinity',
		'Morpheus', 'Vader', 'Kylo', 'Rey', 'Spider', 'Miles', 'Kirito', 'Asuna',
		'Rem', 'Subaru', 'Aqua', 'Megumin', 'Kazuma', 'Albedo', 'Rimuru', 'Shion'
	];
	const character = characters[Math.floor(Math.random() * characters.length)];
	const number = Math.floor(Math.random() * 1000);
	return `${character}${number}`;
}

// Generate a random avatar URL (placeholder logic)
function generateAvatar() {
	const avatars = [
		'/public/avatars/avatar1.png',
		'/public/avatars/avatar2.png',
		'/public/avatars/avatar3.png',
		'/public/avatars/avatar4.png'
	];
	return avatars[Math.floor(Math.random() * avatars.length)];
}

// Format date to readable string
function formatDate(date) {
	return new Date(date).toLocaleString();
}

module.exports = {
	generateUsername,
	generateAvatar,
	formatDate
};
