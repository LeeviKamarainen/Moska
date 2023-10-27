
if (document.readyState !== "loading") {
    initializeLeaderboard();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
        initializeLeaderboard();
    });
  }
let leaderboardData = null;
let sortDirection = {}; // To store the sorting direction for each column
async function  initializeLeaderboard() {

    // Get leaderboard from server:
    let response = fetch("/users/getleaderboard");
    leaderboardData = await response.then(res => res.json());
    console.log(leaderboardData)
    populateLeaderboard();
  
}

function populateLeaderboard() {
  const tableBody = document.getElementById('leaderboard-body');
  tableBody.innerHTML = ''; // Clear the table body
  leaderboardData.forEach(entry => {
      const row = document.createElement('tr');
      
      // Create and populate table cells for each data field
      const usernameCell = document.createElement('td');
      usernameCell.textContent = entry.username;
      const gamesWonCell = document.createElement('td');
      gamesWonCell.textContent = entry.gamesWon;
      const gamesLostCell = document.createElement('td');
      gamesLostCell.textContent = entry.gamesLost;
      const percentWonCell = document.createElement('td');
      percentWonCell.textContent = Math.round(entry.percentWon*100)/100;
      const totalGamesCell = document.createElement('td');
      totalGamesCell.textContent = entry.totalGames;
      const loseStreakCell = document.createElement('td');
      loseStreakCell.textContent = entry.loseStreak;
      
      // Append the cells to the table row
      row.appendChild(usernameCell);
      row.appendChild(gamesWonCell);
      row.appendChild(gamesLostCell);
      row.appendChild(percentWonCell);
      row.appendChild(totalGamesCell);
      row.appendChild(loseStreakCell);
      
      // Append the row to the table body
      tableBody.appendChild(row);
  });
}

function sortTable(columnIndex) {
  console.log(leaderboardData)
  // Get the current sorting direction for the column
  if (!sortDirection[columnIndex]) {
    sortDirection[columnIndex] = 'asc';
} else if (sortDirection[columnIndex] === 'asc') {
    sortDirection[columnIndex] = 'desc';
} else {
    sortDirection[columnIndex] = 'asc';
}

leaderboardData.sort((a, b) => {
    const valueA = a[Object.keys(a)[columnIndex]];
    const valueB = b[Object.keys(b)[columnIndex]];
    if (typeof valueA === 'string') {
        return (sortDirection[columnIndex] === 'asc')
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
    } else {
        return (sortDirection[columnIndex] === 'asc')
            ? valueA - valueB
            : valueB - valueA;
    }
});

  populateLeaderboard(); // Re-render the table with sorted data
}
  