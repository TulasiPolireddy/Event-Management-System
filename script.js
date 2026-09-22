/* ==========================================================================
   EVENT MANAGEMENT SYSTEM - SCRIPT
   ========================================================================== */

// --- 1. SEED / INITIAL STATE ---
const DEFAULT_EVENTS = [
  {
    id: "EVT-101",
    title: "Global Tech Innovation Summit 2026",
    category: "Technology",
    date: "2026-11-20",
    time: "10:00",
    venue: "Convention Hall A, New York & Virtual",
    capacity: 100,
    bookedSeats: 45,
    price: 49,
    description: "Join international industry leaders exploring Artificial Intelligence, Quantum Computing, and Next-Gen Web."
  },
  {
    id: "EVT-102",
    title: "Summer Acoustic Festival",
    category: "Music",
    date: "2026-12-05",
    time: "17:30",
    venue: "Sunset Amphitheatre, California",
    capacity: 50,
    bookedSeats: 50,
    price: 25,
    description: "An evening featuring indie, acoustic, and jazz music by independent artists."
  },
  {
    id: "EVT-103",
    title: "Startup Founders & VC Pitching",
    category: "Business",
    date: "2026-11-28",
    time: "09:00",
    venue: "Venture Hub, Floor 6",
    capacity: 40,
    bookedSeats: 12,
    price: 0,
    description: "Connect with early-stage investors, angel networks, and successful tech founders."
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: "Welcome to Eventify!",
    message: "Browse upcoming conferences, workshops, and book instant verified tickets.",
    type: "info",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 2,
    title: "Seat Alert",
    message: "Summer Acoustic Festival has reached maximum seat capacity!",
    type: "warning",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

// --- 2. LOCALSTORAGE HELPERS ---
function getStorage(key, fallback) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// State variables
let events = getStorage('eventify_events', DEFAULT_EVENTS);
let bookings = getStorage('eventify_bookings', []);
let notifications = getStorage('eventify_notifs', DEFAULT_NOTIFICATIONS);

// --- 3. DOM ELEMENTS ---
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const eventsGrid = document.getElementById('events-grid');
const userSearch = document.getElementById('user-search');
const userFilter = document.getElementById('user-filter');

// Form & Modal elements
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
  checkUpcomingEventReminders();
});

// Navigation / Tabs Switcher
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

// --- 5. RENDER USER EVENTS VIEW ---
function renderEvents() {
  const query = userSearch.value.toLowerCase();
  const category = userFilter.value;

  const filtered = events.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(query) || evt.venue.toLowerCase().includes(query);
    const matchesCategory = category === 'All' || evt.category === category;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    eventsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">No events found matching your criteria.</p>`;
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
            <span class="event-price">${evt.price === 0 ? 'FREE' : `$${evt.price}`}</span>
          </div>
          <h3 class="event-title">${escapeHtml(evt.title)}</h3>
          <div class="event-details">
            📅 ${evt.date} at ${evt.time} <br/>
            📍 ${escapeHtml(evt.venue)}
          </div>
          <p class="event-desc">${escapeHtml(evt.description)}</p>
        </div>

        <div>
          <div class="seat-status">
            <div class="seat-info">
              <span>Available Seats</span>
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
            ${isSoldOut ? 'Sold Out' : 'Register / Book Ticket'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

userSearch.addEventListener('input', renderEvents);
userFilter.addEventListener('change', renderEvents);

// --- 6. EVENT REGISTRATION & TICKET GENERATION ---
let currentEventForBooking = null;

function openRegisterModal(eventId) {
  currentEventForBooking = events.find(e => e.id === eventId);
  if (!currentEventForBooking) return;

  document.getElementById('reg-event-id').value = currentEventForBooking.id;
  document.getElementById('reg-event-title').textContent = currentEventForBooking.title;
  document.getElementById('reg-event-meta').textContent = `📅 ${currentEventForBooking.date} | 📍 ${currentEventForBooking.venue}`;
  
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
  document.getElementById('reg-total-price').textContent = cost === 0 ? 'FREE' : `$${cost}`;
}

registrationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const eventId = document.getElementById('reg-event-id').value;
  const targetEvent = events.find(e => e.id === eventId);
  const seatsCount = parseInt(document.getElementById('reg-tickets').value);

  if (targetEvent.bookedSeats + seatsCount > targetEvent.capacity) {
    showToast('Sorry! Not enough seats available.', 'danger');
    return;
  }

  // Update Seats
  targetEvent.bookedSeats += seatsCount;
  setStorage('eventify_events', events);

  // Generate Booking
  const bookingId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
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
    bookingDate: new Date().toLocaleDateString()
  };

  bookings.push(newBooking);
  setStorage('eventify_bookings', bookings);

  // Trigger Notification
  addNotification(
    "Booking Confirmed!",
    `You secured ${seatsCount} seat(s) for "${targetEvent.title}". Ref: ${bookingId}`,
    "info"
  );

  closeModal('register-modal');
  registrationForm.reset();
  showToast('Booking successful! Your ticket is ready.', 'success');

  renderEvents();
  renderAdminDashboard();
  renderMyBookings();
  showGeneratedTicket(newBooking);
});

// Show Ticket Modal
function showGeneratedTicket(booking) {
  const container = document.getElementById('printable-ticket');
  container.innerHTML = `
    <div class="ticket-header">
      <div>
        <h2 style="font-size:1.3rem;">${escapeHtml(booking.eventTitle)}</h2>
        <span style="font-size:0.85rem; opacity:0.9;">PASS ID: ${booking.bookingId}</span>
      </div>
      <div style="text-align:right;">
        <span style="font-size:0.8rem;">Seats</span>
        <h3 style="font-size:1.4rem;">${booking.ticketsCount}</h3>
      </div>
    </div>
    <div style="font-size:0.9rem; line-height: 1.6;">
      <p>👤 <strong>Attendee:</strong> ${escapeHtml(booking.name)} (${escapeHtml(booking.email)})</p>
      <p>📅 <strong>Date & Time:</strong> ${booking.eventDate} at ${booking.eventTime}</p>
      <p>📍 <strong>Location:</strong> ${escapeHtml(booking.eventVenue)}</p>
      <p>💵 <strong>Amount Paid:</strong> ${booking.totalPaid === 0 ? 'FREE' : '$' + booking.totalPaid}</p>
    </div>
    <div class="ticket-barcode">
      ||||||||||||||||||| ${booking.bookingId} |||||||||||||||||||
    </div>
  `;
  openModal('ticket-modal');
}

// Render "My Bookings" Tab
function renderMyBookings() {
  const container = document.getElementById('tickets-grid');
  if (bookings.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">You have not registered for any events yet.</p>`;
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
          <span style="font-size:0.75rem;">Seats</span>
          <h4>${b.ticketsCount}</h4>
        </div>
      </div>
      <div style="font-size:0.85rem; margin-bottom:10px;">
        📅 ${b.eventDate} | 📍 ${escapeHtml(b.eventVenue)}
      </div>
      <button class="btn btn-secondary btn-sm" onclick='showGeneratedTicket(${JSON.stringify(b)})'>View Full Ticket Pass</button>
    </div>
  `).join('');
}

// --- 7. ADMIN DASHBOARD OPERATIONS ---
function renderAdminDashboard() {
  // Update Metrics
  const totalEvents = events.length;
  const totalBookings = bookings.length;
  const totalAttendees = bookings.reduce((sum, b) => sum + b.ticketsCount, 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPaid, 0);

  document.getElementById('stat-total-events').textContent = totalEvents;
  document.getElementById('stat-total-bookings').textContent = totalBookings;
  document.getElementById('stat-total-attendees').textContent = totalAttendees;
  document.getElementById('stat-total-revenue').textContent = `$${totalRevenue}`;

  // Update Admin Table
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
        <td>${evt.date}<br/><small>${evt.time}</small></td>
        <td>${escapeHtml(evt.venue)}</td>
        <td>${evt.bookedSeats} / ${evt.capacity}</td>
        <td>${evt.price === 0 ? 'FREE' : '$' + evt.price}</td>
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

// Create or Edit Event Submit
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
    // Edit existing event
    const index = events.findIndex(e => e.id === editId);
    if (index !== -1) {
      events[index] = { ...events[index], ...eventPayload };
      addNotification("Event Updated", `Details updated for event: "${eventPayload.title}"`, "warning");
      showToast('Event updated successfully!', 'success');
    }
  } else {
    // Add new event
    const newEvent = {
      id: 'EVT-' + Date.now().toString().slice(-4),
      bookedSeats: 0,
      ...eventPayload
    };
    events.push(newEvent);
    addNotification("New Event Published", `"${newEvent.title}" is now open for registration!`, "info");
    showToast('New event created successfully!', 'success');
  }

  setStorage('eventify_events', events);
  closeModal('event-modal');
  eventAdminForm.reset();

  renderEvents();
  renderAdminDashboard();
});

function openEventModal() {
  document.getElementById('event-edit-id').value = '';
  document.getElementById('event-modal-heading').textContent = 'Create New Event';
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

// Delete Event
function deleteEvent(eventId) {
  const target = events.find(e => e.id === eventId);
  if (!target) return;

  if (confirm(`Are you sure you want to delete "${target.title}"? This will notify all registered users.`)) {
    events = events.filter(e => e.id !== eventId);
    setStorage('eventify_events', events);

    addNotification(
      "Event Cancelled",
      `The event "${target.title}" has been cancelled by the organizer.`,
      "danger"
    );

    showToast('Event removed.', 'danger');
    renderEvents();
    renderAdminDashboard();
  }
}

// View Attendees List Modal
function viewAttendees(eventId) {
  const evt = events.find(e => e.id === eventId);
  const eventAttendees = bookings.filter(b => b.eventId === eventId);

  document.getElementById('attendees-modal-title').textContent = `${evt.title} - Attendees`;
  document.getElementById('attendees-modal-meta').textContent = `Total registered participants: ${eventAttendees.length}`;

  const tbody = document.getElementById('attendees-tbody');
  if (eventAttendees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No participants have registered yet.</td></tr>`;
  } else {
    tbody.innerHTML = eventAttendees.map(a => `
      <tr>
        <td><code>${a.bookingId}</code></td>
        <td>${escapeHtml(a.name)}</td>
        <td>${escapeHtml(a.email)}</td>
        <td>${escapeHtml(a.phone)}</td>
        <td>${a.ticketsCount}</td>
        <td>${a.totalPaid === 0 ? 'FREE' : '$' + a.totalPaid}</td>
      </tr>
    `).join('');
  }

  openModal('attendees-modal');
}

// --- 8. NOTIFICATION ENGINE ---
function addNotification(title, message, type = 'info') {
  const newNotif = {
    id: Date.now(),
    title,
    message,
    type,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  notifications.unshift(newNotif);
  setStorage('eventify_notifs', notifications);
  
  // Increment badge
  notifBadge.textContent = parseInt(notifBadge.textContent || 0) + 1;
  renderNotifications();
}

function renderNotifications() {
  const container = document.getElementById('notifications-list');
  if (notifications.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">No notifications right now.</p>`;
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
  setStorage('eventify_notifs', notifications);
  notifBadge.textContent = '0';
  renderNotifications();
}

// Scheduled check for upcoming events
function checkUpcomingEventReminders() {
  const today = new Date().toISOString().split('T')[0];
  events.forEach(evt => {
    if (evt.date === today) {
      addNotification("Event Reminder Today!", `"${evt.title}" is happening today at ${evt.time} in ${evt.venue}.`, "warning");
    }
  });
}

// --- 9. UTILITY / MODAL HELPERS ---
function openModal(modalId) {
  document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

// Close modal when clicking outside content
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
  if (type === 'success') toast.style.borderLeft = '4px solid #10b981';
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
