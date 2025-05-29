
const firebaseConfig = {
    apiKey: "AIzaSyBeC_hKu2RQgkF9mWXB6j8__PWPy6zTf-o",
    authDomain: "zalito-cceda.firebaseapp.com",
    projectId: "zalito-cceda",
    storageBucket: "zalito-cceda.firebasestorage.app",
    messagingSenderId: "485747830430",
    appId: "1:485747830430:web:776eb67246bd9f5a27d58f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const plantContainer = document.getElementById("plants");
const gardenContainer = document.getElementById("garden");
const reminderContainer = document.getElementById("reminders");

function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert("Účet vytvořen!"))
        .catch(error => alert(error.message));
}

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert("Přihlášeno!");
            document.getElementById("auth-screen").style.display = "none";
            document.getElementById("main-content").style.display = "block";
            loadUserGarden();
            checkReminders();
        })
        .catch(error => {
            console.error("Chyba při přihlášení:", error.code, error.message);
            alert(`Chyba: ${error.code} ${error.message}`);
        });
}

function logout() {
    auth.signOut().then(() => {
        alert("Odhlášeno!");
        document.getElementById("main-content").style.display = "none";
        document.getElementById("auth-screen").style.display = "flex";
    });
}

function addPlant() {
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById("plant-name").value;
  const note = document.getElementById("plant-note").value;
  const icon = document.getElementById("plant-icon").value;
  const color = document.getElementById("plant-color").value;


  if (!name) {
    return alert("Název rostliny je povinný!");
  }

  const plant = {
  name,
  note,
  icon,
  color,
  addedAt: Date.now()
};


  db.collection("users").doc(user.uid).collection("garden").add(plant)
    .then(() => {
      document.getElementById("plant-name").value = "";
      document.getElementById("plant-note").value = "";
      loadUserGarden();
    })
    .catch(error => alert("Chyba při ukládání: " + error.message));
}



function loadUserGarden() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("users").doc(user.uid).collection("garden").get()
    .then(snapshot => {
      const garden = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderGarden(garden);
    });
}


function renderGarden(garden) {
    gardenContainer.innerHTML = "";
    garden.forEach((plant, index) => {
        const card = document.createElement("div");
card.className = "plant-card";
card.style.backgroundColor = plant.color || "#F2E8CF";
card.innerHTML = `
  <h3>${plant.name}</h3>
  <p>${plant.icon}</p>
  <p>${plant.note}</p>
  <input type="number" placeholder="Dny do zálivky" id="timer-${index}" />
  <button onclick="setReminder('${plant.name}', ${index})">Nastavit připomínku</button>
  <button onclick="removeFromGarden('${plant.name}')">Odebrat</button>
`;

        gardenContainer.appendChild(card);
    });
}
function removeFromGarden(plantName) {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("users").doc(user.uid).collection("garden")
    .where("name", "==", plantName)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.delete();
      });
      loadUserGarden(); // obnoví zahrádku
    })
    .catch(error => {
      alert("Chyba při mazání: " + error.message);
    });
}

function setReminder(name, index) {
  const user = auth.currentUser;
  if (!user) return;

  const days = parseInt(document.getElementById(`timer-${index}`).value);
  if (!days || days <= 0) return alert("Zadej čas ve dnech!");

  const remindAt = Date.now() + days * 24 * 60 * 60 * 1000;

  db.collection("users").doc(user.uid).collection("reminders").add({
    plant: name,
    remindAt
  }).then(() => {
    alert(`Připomínka nastavena za ${days} dní.`);
    checkReminders();
  });
}


function checkReminders() {
  const user = auth.currentUser;
  if (!user) return;

  const now = Date.now();

  db.collection("users").doc(user.uid).collection("reminders").get()
    .then(snapshot => {
      const reminders = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.remindAt <= now) {
          alert(`Čas zalít ${data.plant}!`);
          doc.ref.delete(); // smaže připomínku po upozornění
        } else {
          reminders.push(data);
        }
      });
      renderReminders(reminders);
    });
}


function renderReminders(reminders) {
    reminderContainer.innerHTML = "";
    reminders.forEach(reminder => {
        const remindAtDate = new Date(reminder.remindAt);
        const reminderCard = document.createElement("div");
        reminderCard.className = "reminder-card";
        reminderCard.innerHTML = `
  <p><strong>${reminder.plant}</strong> - Připomínka: ${remindAtDate.toLocaleString()}</p>
  <button onclick="removeReminder('${reminder.plant}', ${reminder.remindAt})">Odebrat</button>
`;

        reminderContainer.appendChild(reminderCard);
    });
}
function removeReminder(plantName, remindAt) {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("users").doc(user.uid).collection("reminders")
    .where("plant", "==", plantName)
    .where("remindAt", "==", remindAt)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => doc.ref.delete());
      checkReminders(); // aktualizuje seznam
    })
    .catch(error => {
      alert("Chyba při mazání připomínky: " + error.message);
    });
}


// Automatické přihlášení uživatele
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("auth-screen").style.display = "none";
        document.getElementById("main-content").style.display = "block";
        loadUserGarden();
        checkReminders();
    } else {
        document.getElementById("auth-screen").style.display = "flex";
        document.getElementById("main-content").style.display = "none";
    }
});

// Zajistí, že tlačítko zpět bude fungovat až po načtení DOMu
// Automatické přihlášení uživatele
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("auth-screen").style.display = "none";
        document.getElementById("main-content").style.display = "block";
        loadUserGarden();
        checkReminders();
    } else {
        document.getElementById("auth-screen").style.display = "flex";
        document.getElementById("main-content").style.display = "none";
    }
});

// Zajistí, že tlačítko zpět bude fungovat až po načtení DOMu
window.addEventListener("DOMContentLoaded", () => {
    const backBtn = document.getElementById("back-to-search");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            document.getElementById("search-results").style.display = "grid";
            document.getElementById("search").style.display = "block";
            document.getElementById("my-garden").style.display = "none";
            document.getElementById("back-to-search").style.display = "none";
        });
    }
});

window.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".falling-images");
  const images = ["search1.svg", "search2.svg", "search3.svg"]; // názvy obrázků ve složce ./imgs/
  const count = 15; // počet obrázků na obrazovce

  for (let i = 0; i < count; i++) {
    const img = document.createElement("div");
    img.className = "falling-img";
    const randomImg = images[Math.floor(Math.random() * images.length)];
    img.style.backgroundImage = `url('./imgs/${randomImg}')`;
    img.style.left = `${Math.random() * 100}%`;
    img.style.animationDuration = `${5 + Math.random() * 10}s`;
    img.style.top = `${-Math.random() * 100}px`;
    container.appendChild(img);
  }
});
