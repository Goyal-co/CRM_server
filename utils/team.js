const team = ["Sahil", "Pratham", "Srinivas"];
let currentIndex = 0;

function getNextAssignee() {
  const assignee = team[currentIndex];
  currentIndex = (currentIndex + 1) % team.length;
  return assignee;
}

export default getNextAssignee;
