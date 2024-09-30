
if (document.readyState !== "loading") {
	initializeLeaderboard();
} else {
	document.addEventListener("DOMContentLoaded", function () {
		initializeLeaderboard();
	});
}
let leaderboardData = null;
let sortDirection = {}; // To store the sorting direction for each column
async function initializeLeaderboard() {

	// Get leaderboard from server:
	let response = fetch("/users/getleaderboard");
	leaderboardData = await response.then(res => res.json());
	populateLeaderboard();
	sortTable(1); // Sort by ELO rating by default
	sortTable(1); // Sort by ELO rating by default

}

function populateLeaderboard() {
	const tableBody = document.getElementById('leaderboard-body');
	tableBody.innerHTML = ''; // Clear the table body
	leaderboardData.forEach(entry => {
		const row = document.createElement('tr');

		// Create and populate table cells for each data field
		const usernameCell = document.createElement('td');
		usernameCell.textContent = entry.username;
		const ratingCell = document.createElement('td');
		ratingCell.textContent = Math.round(entry.rating * 1000);
		const averageEvaluationCell = document.createElement('td');
		averageEvaluationCell.textContent = isNaN(Math.round(entry.averageEvaluation * 100) / 100) ? 0 : Math.round(entry.averageEvaluation * 100) / 100;
		const gamesWonCell = document.createElement('td');
		gamesWonCell.textContent = entry.gamesWon;
		const gamesLostCell = document.createElement('td');
		gamesLostCell.textContent = entry.gamesLost;
		const percentWonCell = document.createElement('td');
		percentWonCell.textContent = Math.round(entry.percentWon * 100) / 100;
		const totalGamesCell = document.createElement('td');
		totalGamesCell.textContent = entry.totalGames;
		const loseStreakCell = document.createElement('td');
		loseStreakCell.textContent = entry.loseStreak;

		// Append the cells to the table row
		row.appendChild(usernameCell);
		row.appendChild(ratingCell);
		row.appendChild(averageEvaluationCell);
		row.appendChild(gamesWonCell);
		row.appendChild(gamesLostCell);
		row.appendChild(percentWonCell);
		row.appendChild(totalGamesCell);
		row.appendChild(loseStreakCell);

		// Append the row to the table body
		tableBody.appendChild(row);
	});
}

/* Help for sorting from : https://www.w3schools.com/howto/howto_js_sort_table.asp */
/**
 * Sorts the rows of a table based on the content of the cells in the specified column.
 * The sorting alternates between ascending and descending order.
 *
 * @param {number} n - The index of the column to sort by (0-based).
 */
function sortTable(n) {
	var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
	table = document.getElementById('leaderboard-body');
	switching = true;
	// Set the sorting direction to ascending:
	dir = sortDirection[n] === "asc" ? "desc" : "asc";
	sortDirection[n] = dir;

	// Hide all sort icons
	const allSortIcons = document.querySelectorAll('[id^="sort-icon"]');
	allSortIcons.forEach(icon => {
		icon.style.display = 'none';
	});

	// Show the sort icon for the current column
	const sortIcon = document.getElementById(`sort-icon${n}`);
	sortIcon.style.display = 'inline';
	sortIcon.textContent = dir === "asc" ? '↑' : '↓';

	/* Make a loop that will continue until
	no switching has been done: */
	while (switching) {
		// Start by saying: no switching is done:
		switching = false;
		rows = table.rows;
		/* Loop through all table rows (except the
		first, which contains table headers): */
		for (i = 0; i < (rows.length - 1); i++) {
			// Start by saying there should be no switching:
			shouldSwitch = false;
			/* Get the two elements you want to compare,
			one from current row and one from the next: */
			x = rows[i].getElementsByTagName("TD")[n];
			y = rows[i + 1].getElementsByTagName("TD")[n];

			// Check whether x and y are strings or numbers:
			var xIsString = isNaN(Number(x.innerHTML));
			var yIsString = isNaN(Number(y.innerHTML));
			// Assume default to be numbers:
			let xComp = Number(x.innerHTML);
			let yComp = Number(y.innerHTML);
			if (xIsString && yIsString) {
				xComp = x.innerHTML.toLowerCase();
				yComp = y.innerHTML.toLowerCase();
			}

			/* Check if the two rows should switch place,
			based on the direction, asc or desc: */
			if (dir == "asc") {
				if (xComp > yComp) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			} else if (dir == "desc") {
				if (xComp < yComp) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			/* If a switch has been marked, make the switch
			and mark that a switch has been done: */
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			// Each time a switch is done, increase this count by 1:
			switchcount++;
		} else {
			/* If no switching has been done AND the direction is "desc",
			set the direction to "asc" and run the while loop again. */
			if (switchcount == 0 && dir == "desc") {
				dir = "asc";
				switching = true;
			}
		}
	}
}