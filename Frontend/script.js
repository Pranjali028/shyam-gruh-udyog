const API_BASE_URL = "https://shyam-gruh-udyog.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded:", window.location.pathname);

  // =====================
  // LOGIN PAGE (index.html)
  // =====================
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const owner = ["saurav", "shubham"];
      const role = owner.includes(username)? "owner" : "worker";

     try {
        const res = await fetch(`${API_BASE_URL}/api/login`, {   // 🔥 fixed
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, username, password })
        });

        const data = await res.json();

        if (data.success) {
          alert("✅ Login success!");
          if (role === "worker") {
            localStorage.setItem("workerUsername", username);
            window.location.href = "worker.html";
          } if (role === "owner") {
            window.location.href = "owner.html"; // owner.html / worker.html
          }
          
        } else {
          alert("❌ " + data.message);
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("⚠ Server error, check backend running or not.");
      }
    });
  }

  // =====================
  // OWNER DASHBOARD (owner.html)
  // =====================
  const saveBtn = document.getElementById("saveSettings");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const rate = document.getElementById("rate").value;
      const lat = document.getElementById("lat").value;
      const lng = document.getElementById("lng").value;
      const radius = document.getElementById("radius").value;

      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rate, lat, lng, radius })
        });
        const data = await res.json();
        alert(data.message || "✅ Settings saved!");
      } catch (err) {
        console.error("Save settings error:", err);
      }
    });
  }

  const addWorkerBtn = document.getElementById("addWorker");
  if (addWorkerBtn) {
    addWorkerBtn.addEventListener("click", async () => {
      const name = document.getElementById("wName").value;
      const username = document.getElementById("wUser").value;
      const password = document.getElementById("wPass").value;

      try {
        const res = await fetch(`${API_BASE_URL}/api/workers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, username, password })
        });
        const data = await res.json();
        alert(data.message || "👷 Worker added!");
        loadWorkers();
      } catch (err) {
        console.error("Add worker error:", err);
      }
    });

    // Worker list load
    async function loadWorkers() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/workers`);
        const data = await res.json();
        const list = document.getElementById("workerList");
        list.innerHTML = "";
        data.forEach(w => {
          const div = document.createElement("div");
          div.textContent = `${w.name} (${w.username})`;
          list.appendChild(div);
        });
      } catch (err) {
        console.error("Load workers error:", err);
      }
    }
    loadWorkers(); // call once
  }

  const reportButtons = document.querySelectorAll(".range");
  if (reportButtons.length > 0) {
    reportButtons.forEach(btn => {
      btn.addEventListener("click", () => loadReports(btn.dataset.range));
    });

    document.getElementById("refreshReports").addEventListener("click", () => loadReports("daily"));

    async function loadReports(range) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports?range=${range}`);
        const data = await res.json();
        document.getElementById("sum").textContent =` Total: ₹${data.total || 0}`;
        const rows = document.getElementById("rows");
        rows.innerHTML = "";
        data.reports.forEach(r => {
          const div = document.createElement("div");
          div.textContent = `${r.worker} — ${r.hours} hrs — ₹${r.pay}`;
          rows.appendChild(div);
        });
      } catch (err) {
        console.error("Load reports error:", err);
      }
    }
  }

// =====================
// WORKER DASHBOARD (worker.html)
// =====================
const worker = localStorage.getItem("workerUsername");

const checkinBtn = document.getElementById("checkin");
const checkoutBtn = document.getElementById("checkout");
const reportSelfBtn = document.getElementById("reportSelf");
const wreportDiv = document.getElementById("wreport");
const wmsgDiv = document.getElementById("wmsg");

if (checkinBtn) {
  checkinBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker })
      });
      const data = await res.json();
      wmsgDiv.textContent = data.message || "✅ Checked in";
    } catch (err) {
      console.error("Checkin error:", err);
      wmsgDiv.textContent = "⚠ Server error on checkin";
    }
  });
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker })
      });
      const data = await res.json();
      wmsgDiv.textContent = data.message || "✅ Checked out";
    } catch (err) {
      console.error("Checkout error:", err);
      wmsgDiv.textContent = "⚠ Server error on checkout";
    }
  });
}

if (reportSelfBtn) {
  reportSelfBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/self?worker=${worker}`);
      const reports = await res.json();
      if (!reports.length) {
        wreportDiv.innerHTML = "<p>No reports found</p>";
        return;
      }
      wreportDiv.innerHTML = "";
      reports.forEach(r => {
        const div = document.createElement("div");
        div.textContent = `${new Date(r.date).toLocaleDateString()} — ${r.hours.toFixed(2)} hrs — ₹${r.pay.toFixed(2)}`;
        wreportDiv.appendChild(div);
      });
    } catch (err) {
      console.error("Report fetch error:", err);
      wreportDiv.innerHTML = "<p>⚠ Failed to load reports</p>";
    }
  });
}
  // =====================
  // LOGOUT
  // =====================
  const logoutOwnerBtn = document.getElementById("logoutOwner");
  if (logoutOwnerBtn) {
    logoutOwnerBtn.addEventListener("click", () => {
      alert("👋 Logged out successfully!");
      window.location.href = "index.html";
    });
  };
});