/* ==========================================================================
   HYDERABAD EVENT MANAGEMENT SYSTEM - JAVASCRIPT
   ========================================================================== */

// --- 1. DEFAULT SEED DATA (Hyderabad Venues & IST Timings) ---
const DEFAULT_EVENTS = [
  {
    id: "HYD-101",
    title: "Hyderabad AI & Cloud Tech Summit 2026",
    category: "Tech & Startups",
    date: "2026-10-15",
    time: "10:00", // 10:00 AM
    venue: "HITEX Exhibition Centre, Hall 2, Madhapur",
    capacity: 150,
    bookedSeats: 85,
    price: 499,
    description: "Connect with tech leaders, developers, and cloud architects across Telangana & Cyberabad."
  },
  {
    id: "HYD-102",
    title: "Deccan Food & Acoustic Music Fest",
    category: "Music & Food",
    date: "2026-10-24",
    time: "17:30", // 05:30 PM
    venue: "Shilparamam Amphitheatre, Hitec City",
    capacity: 200,
    bookedSeats: 200,
    price: 250,
    description: "Enjoy authentic Hyderabadi culinary treats, live Telugu & Hindi acoustic fusion bands."
  },
  {
    id: "HYD-103",
    title: "T-Hub Founders & Angel Pitch Day",
    category: "Tech & Startups",
    date: "2026-11-05",
    time: "11:00", // 11:00 AM
    venue: "T-Hub Phase 2, Knowledge City, Raidurg",
    capacity: 60,
    bookedSeats: 24,
    price: 0,
    description: "Exclusive pitching event for early-stage startup founders with Hyderabad Angels & VCs."
  },
  {
    id: "HYD-104",
    title: "Classical Kuchipudi & Telugu Cultural Night",
    category: "Arts & Culture",
    date: "2026-11-12",
    time: "18:30", // 06:30 PM
    venue: "Ravindra Bharathi Auditorium, Saifabad",
    capacity: 120,
    bookedSeats: 45,
    price: 150,
    description: "An auspicious evening celebrating traditional classical dance and folk music of Telugu heritage."
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: "Welcome to HydEvents!",
    message: "Explore top conferences, meetups, and fests across Hyderabad & Cyberabad.",
    type: "info",
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  },
  {
    id: 2,
    title: "Housefull Alert",
    message: "Deccan Food & Acoustic Music Fest at Shilparamam is now 100% Sold Out!",
    type: "warning",
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
];

// --- 2. STORAGE HELPERS ---
function getStorage(key, fallback) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// State management
let events = getStorage('hydevents_list', DEFAULT_EVENTS);
let bookings = getStorage('hydevents_bookings', []);
let notifications = getStorage('hydevents_notifs', DEFAULT_NOTIFICATIONS);

// Helper: Convert 24-hr time (e.g. "17:30") to 12-hr IST display ("05:30 PM")
function formatTimeIST(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const formattedH = h < 10 ? '0' + h : h;
  return `${formattedH}:${minutes} ${ampm} IST`;
}

// --- 3. DOM ELEMENTS ---
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const eventsGrid = document.getElementById('events-grid');
const userSearch = document.getElementById('user-search');
const userFilter = document.getElementById('user-filter');
const registrationForm = document.getElementById('registration-form');
const eventAdminForm = document.getElementById('event-admin-form');
const notifBadge = document.getElementById('notif-badge');

// --- 4. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  renderEvents();
  renderAdminDashboard();
  renderMyBookings();
  renderNotifications();
});

function setupNavigation() {
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      navButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((tab) => tab.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'notifications-view') {
        notifBadge.textContent = '0';
      }
    });
  });
}

// --- 5. RENDER EVENTS (User View) ---
function renderEvents() {
  const query = userSearch.value.toLowerCase();
  const category = userFilter.value;

  const filtered = events.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(query) || evt.venue.toLowerCase().includes(query);
    const matchesCategory = category === 'All' || evt.category === category;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    eventsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 40px 0;">No events found in Hyderabad matching your search.</p>`;
    return;
  }

  eventsGrid.innerHTML = filtered.map(evt => {
    const isSoldOut = evt.bookedSeats >= evt.capacity;
    const progressPercent = Math.min((evt.bookedSeats / evt.capacity) * 100, 100);

    return `
      <div class="event-card">
        <div>
          <div class="event-card-header">
            <span class="event-cat">${evt.category}</span>
            <span class="event-price">${evt.price === 0 ? 'FREE ENTRY' : `₹${evt.price}`}</span>
          </div>
          <h3 class="event-title">${escapeHtml(evt.title)}</h3>
          <div class="event-details">
            📅 <strong>Date:</strong> ${evt.date} <br/>
            ⏰ <strong>Timing:</strong> ${formatTimeIST(evt.time)} <br/>
            📍 <strong>Venue:</strong> ${escapeHtml(evt.venue)}
          </div>
          <p class="event-desc">${escapeHtml(evt.description)}</p>
        </div>

        <div>
          <div class="seat-status">
            <div class="seat-info">
              <span>Available Passes</span>
              <span>${evt.capacity - evt.bookedSeats} / ${evt.capacity}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
          </div>
          <button 
            class="btn btn-primary btn-block" 
            ${isSoldOut ? 'disabled style="background:#94a3b8;cursor:not-allowed;"' : ''}
            onclick="openRegisterModal('${evt.id}')">
            ${isSoldOut ? 'Sold Out' : 'Book Pass'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

userSearch.addEventListener('input', renderEvents);
userFilter.addEventListener('change', renderEvents);

// --- 6. REGISTRATION & TICKET GENERATION ---
let currentEventForBooking = null;

function openRegisterModal(eventId) {
  currentEventForBooking = events.find(e => e.id === eventId);
  if (!currentEventForBooking) return;

  document.getElementById('reg-event-id').value = currentEventForBooking.id;
  document.getElementById('reg-event-title').textContent = currentEventForBooking.title;
  document.getElementById('reg-event-meta').textContent = `📅 ${currentEventForBooking.date} (${formatTimeIST(currentEventForBooking.time)}) | 📍 ${currentEventForBooking.venue}`;
  
  const ticketInput = document.getElementById('reg-tickets');
  const available = currentEventForBooking.capacity - currentEventForBooking.bookedSeats;
  ticketInput.max = Math.min(5, available);
  ticketInput.value = 1;

  updateRegistrationPrice();
  openModal('register-modal');
}

document.getElementById('reg-tickets').addEventListener('input', updateRegistrationPrice);

function updateRegistrationPrice() {
  if (!currentEventForBooking) return;
  const count = parseInt(document.getElementById('reg-tickets').value) || 1;
  const cost = count * currentEventForBooking.price;
  document.getElementById('reg-total-price').textContent = cost === 0 ? 'FREE' : `₹${cost}`;
}

registrationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const eventId = document.getElementById('reg-event-id').value;
  const targetEvent = events.find(e => e.id === eventId);
  const seatsCount = parseInt(document.getElementById('reg-tickets').value);

  if (targetEvent.bookedSeats + seatsCount > targetEvent.capacity) {
    showToast('Seats are no longer available.', 'danger');
    return;
  }

  // Update Seats
  targetEvent.bookedSeats += seatsCount;
  setStorage('hydevents_list', events);

  // Generate Booking
  const bookingId = 'HYD-PASS-' + Math.floor(100000 + Math.random() * 900000);
  const newBooking = {
    bookingId,
    eventId: targetEvent.id,
    eventTitle: targetEvent.title,
    eventDate: targetEvent.date,
    eventTime: targetEvent.time,
    eventVenue: targetEvent.venue,
    name: document.getElementById('reg-name').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    phone: document.getElementById('reg-phone').value.trim(),
    ticketsCount: seatsCount,
    totalPaid: seatsCount * targetEvent.price,
    bookingDate: new Date().toLocaleDateString('en-IN')
  };

  bookings.push(newBooking);
  setStorage('hydevents_bookings', bookings);

  addNotification(
    "Booking Confirmed!",
    `Confirmed ${seatsCount} pass(es) for "${targetEvent.title}". Pass Ref: ${bookingId}`,
    "info"
  );

  closeModal('register-modal');
  registrationForm.reset();
  showToast('Booking Confirmed! Entry Pass Generated.', 'success');

  renderEvents();
  renderAdminDashboard();
  renderMyBookings();
  showGeneratedTicket(newBooking);
});

// Show Printable Pass
function showGeneratedTicket(booking) {
  const container = document.getElementById('printable-ticket');
  container.innerHTML = `
    <div class="ticket-header">
      <div>
        <h2 style="font-size:1.25rem;">${escapeHtml(booking.eventTitle)}</h2>
        <span style="font-size:0.85rem; opacity:0.9;">PASS REF: ${booking.bookingId}</span>
      </div>
      <div style="text-align:right;">
        <span style="font-size:0.75rem;">Total Passes</span>
        <h3 style="font-size:1.4rem;">${booking.ticketsCount}</h3>
      </div>
    </div>
    <div style="font-size:0.9rem; line-height: 1.7;">
      <p>👤 <strong>Attendee:</strong> ${escapeHtml(booking.name)} (${escapeHtml(booking.phone)})</p>
      <p>📅 <strong>Date:</strong> ${booking.eventDate}</p>
      <p>⏰ <strong>Time:</strong> ${formatTimeIST(booking.eventTime)}</p>
      <p>📍 <strong>Hyderabad Venue:</strong> ${escapeHtml(booking.eventVenue)}</p>
      <p>💵 <strong>Amount:</strong> ${booking.totalPaid === 0 ? 'FREE ENTRY' : '₹' + booking.totalPaid}</p>
    </div>
    <div class="ticket-barcode">
      |||||||| ${booking.bookingId} ||||||||
    </div>
  `;
  openModal('ticket-modal');
}

// Render "My Bookings"
function renderMyBookings() {
  const container = document.getElementById('tickets-grid');
  if (bookings.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">You have no event passes booked yet.</p>`;
    return;
  }

  container.innerHTML = bookings.map(b => `
    <div class="ticket-pass">
      <div class="ticket-header">
        <div>
          <h3>${escapeHtml(b.eventTitle)}</h3>
          <span style="font-size:0.8rem; opacity:0.9;">Ref: ${b.bookingId}</span>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem;">Passes</span>
          <h4>${b.ticketsCount}</h4>
        </div>
      </div>
      <div style="font-size:0.85rem; margin-bottom:12px; line-height:1.5;">
        📅 ${b.eventDate} (${formatTimeIST(b.eventTime)}) <br/>
        📍 ${escapeHtml(b.eventVenue)}
      </div>
      <button class="btn btn-secondary btn-sm" onclick='showGeneratedTicket(${JSON.stringify(b)})'>View / Print Pass</button>
    </div>
  `).join('');
}

// --- 7. ADMIN DASHBOARD ---
function renderAdminDashboard() {
  const totalEvents = events.length;
  const totalBookings = bookings.length;
  const totalAttendees = bookings.reduce((sum, b) => sum + b.ticketsCount, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPaid, 0);

  document.getElementById('stat-total-events').textContent = totalEvents;
  document.getElementById('stat-total-bookings').textContent = totalBookings;
  document.getElementById('stat-total-attendees').textContent = totalAttendees;
  document.getElementById('stat-total-revenue').textContent = `₹${totalRevenue}`;

  const tbody = document.getElementById('admin-events-tbody');
  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No events created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(evt => {
    const isSoldOut = evt.bookedSeats >= evt.capacity;
    return `
      <tr>
        <td><strong>${escapeHtml(evt.title)}</strong><br/><small style="color:var(--text-muted);">${evt.category}</small></td>
        <td>${evt.date}<br/><small>${formatTimeIST(evt.time)}</small></td>
        <td>${escapeHtml(evt.venue)}</td>
        <td>${evt.bookedSeats} / ${evt.capacity}</td>
        <td>${evt.price === 0 ? 'FREE' : '₹' + evt.price}</td>
        <td>
          <span class="status-badge ${isSoldOut ? 'status-soldout' : 'status-available'}">
            ${isSoldOut ? 'Sold Out' : 'Active'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:5px;">
            <button class="btn btn-secondary btn-sm" onclick="viewAttendees('${evt.id}')">Attendees</button>
            <button class="btn btn-secondary btn-sm" onclick="openEditEventModal('${evt.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteEvent('${evt.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Create/Edit Event Form
eventAdminForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const editId = document.getElementById('event-edit-id').value;

  const eventPayload = {
    title: document.getElementById('evt-title').value.trim(),
    category: document.getElementById('evt-category').value,
    price: parseFloat(document.getElementById('evt-price').value) || 0,
    date: document.getElementById('evt-date').value,
    time: document.getElementById('evt-time').value,
    venue: document.getElementById('evt-venue').value.trim(),
    capacity: parseInt(document.getElementById('evt-capacity').value),
    description: document.getElementById('evt-desc').value.trim()
  };

  if (editId) {
    const index = events.findIndex(e => e.id === editId);
    if (index !== -1) {
      events[index] = { ...events[index], ...eventPayload };
      addNotification("Schedule Update", `Details updated for Hyderabad event: "${eventPayload.title}"`, "warning");
      showToast('Event updated successfully!', 'success');
    }
  } else {
    const newEvent = {
      id: 'HYD-' + Date.now().toString().slice(-4),
      bookedSeats: 0,
      ...eventPayload
    };
    events.push(newEvent);
    addNotification("New Event in Hyderabad", `"${newEvent.title}" at ${newEvent.venue} is now open!`, "info");
    showToast('New event created!', 'success');
  }

  setStorage('hydevents_list', events);
  closeModal('event-modal');
  eventAdminForm.reset();

  renderEvents();
  renderAdminDashboard();
});

function openEventModal() {
  document.getElementById('event-edit-id').value = '';
  document.getElementById('event-modal-heading').textContent = 'Add New Hyderabad Event';
  eventAdminForm.reset();
  openModal('event-modal');
}

function openEditEventModal(eventId) {
  const evt = events.find(e => e.id === eventId);
  if (!evt) return;

  document.getElementById('event-edit-id').value = evt.id;
  document.getElementById('event-modal-heading').textContent = 'Edit Event Details';

  document.getElementById('evt-title').value = evt.title;
  document.getElementById('evt-category').value = evt.category;
  document.getElementById('evt-price').value = evt.price;
  document.getElementById('evt-date').value = evt.date;
  document.getElementById('evt-time').value = evt.time;
  document.getElementById('evt-venue').value = evt.venue;
  document.getElementById('evt-capacity').value = evt.capacity;
  document.getElementById('evt-desc').value = evt.description;

  openModal('event-modal');
}

function deleteEvent(eventId) {
  const target = events.find(e => e.id === eventId);
  if (!target) return;

  if (confirm(`Cancel and delete "${target.title}"? This will alert all registered attendees.`)) {
    events = events.filter(e => e.id !== eventId);
    setStorage('hydevents_list', events);

    addNotification(
      "Event Cancelled",
      `The event "${target.title}" at ${target.venue} has been cancelled.`,
      "danger"
    );

    showToast('Event deleted.', 'danger');
    renderEvents();
    renderAdminDashboard();
  }
}

function viewAttendees(eventId) {
  const evt = events.find(e => e.id === eventId);
  const eventAttendees = bookings.filter(b => b.eventId === eventId);

  document.getElementById('attendees-modal-title').textContent = `${evt.title} - Attendees`;
  document.getElementById('attendees-modal-meta').textContent = `Total attendees registered: ${eventAttendees.length}`;

  const tbody = document.getElementById('attendees-tbody');
  if (eventAttendees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No participants have registered for this event yet.</td></tr>`;
  } else {
    tbody.innerHTML = eventAttendees.map(a => `
      <tr>
        <td><code>${a.bookingId}</code></td>
        <td>${escapeHtml(a.name)}</td>
        <td>${escapeHtml(a.email)}</td>
        <td>${escapeHtml(a.phone)}</td>
        <td>${a.ticketsCount}</td>
        <td>${a.totalPaid === 0 ? 'FREE' : '₹' + a.totalPaid}</td>
      </tr>
    `).join('');
  }

  openModal('attendees-modal');
}

// --- 8. NOTIFICATIONS ---
function addNotification(title, message, type = 'info') {
  const newNotif = {
    id: Date.now(),
    title,
    message,
    type,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  };

  notifications.unshift(newNotif);
  setStorage('hydevents_notifs', notifications);
  
  notifBadge.textContent = parseInt(notifBadge.textContent || 0) + 1;
  renderNotifications();
}

function renderNotifications() {
  const container = document.getElementById('notifications-list');
  if (notifications.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">No active notifications.</p>`;
    return;
  }

  container.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.type}">
      <div class="notif-header">
        <span>${escapeHtml(n.title)}</span>
        <span class="notif-time">${n.time}</span>
      </div>
      <p style="font-size: 0.88rem; color: #475569;">${escapeHtml(n.message)}</p>
    </div>
  `).join('');
}

function clearNotifications() {
  notifications = [];
  setStorage('hydevents_notifs', notifications);
  notifBadge.textContent = '0';
  renderNotifications();
}

// --- 9. UTILITY HELPERS ---
function openModal(modalId) {
  document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('open');
  }
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'danger') toast.style.borderLeft = '4px solid #ef4444';
  if (type === 'success') toast.style.borderLeft = '4px solid #16a34a';
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
