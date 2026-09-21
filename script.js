// Grab DOM elements
const eventForm = document.getElementById('event-form');
const eventsGrid = document.getElementById('events-grid');
const searchBar = document.getElementById('search-bar');
const filterCategory = document.getElementById('filter-category');
const eventCount = document.getElementById('event-count');

// Load events from LocalStorage or start with sample data
let events = JSON.parse(localStorage.getItem('events')) || [
  {
    id: 1,
    title: 'Web Development Meetup',
    date: '2026-10-15',
    time: '18:00',
    category: 'Tech',
    location: 'Community Hall / Online',
    desc: 'An open networking and coding session for beginner web developers.'
  }
];

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
  renderEvents();
});

// Event Listener: Form Submission
eventForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newEvent = {
    id: Date.now(), // Unique ID using timestamp
    title: document.getElementById('event-title').value.trim(),
    date: document.getElementById('event-date').value,
    time: document.getElementById('event-time').value,
    category: document.getElementById('event-category').value,
    location: document.getElementById('event-location').value.trim(),
    desc: document.getElementById('event-desc').value.trim()
  };

  events.push(newEvent);
  saveToLocalStorage();
  renderEvents();

  // Reset the form
  eventForm.reset();
});

// Event Listener: Search Bar & Filter
searchBar.addEventListener('input', renderEvents);
filterCategory.addEventListener('change', renderEvents);

// Delete Event Handler
function deleteEvent(id) {
  if (confirm('Are you sure you want to delete this event?')) {
    events = events.filter((event) => event.id !== id);
    saveToLocalStorage();
    renderEvents();
  }
}

// Render Events to the screen
function renderEvents() {
  const searchTerm = searchBar.value.toLowerCase();
  const selectedCategory = filterCategory.value;

  // Filter events based on search query & category selection
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm) ||
                          event.location.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Update event counter
  eventCount.textContent = filteredEvents.length;

  // Render cards
  if (filteredEvents.length === 0) {
    eventsGrid.innerHTML = `<div class="empty-state">No events found.</div>`;
    return;
  }

  eventsGrid.innerHTML = filteredEvents.map((event) => {
    return `
      <div class="event-card">
        <button class="delete-btn" onclick="deleteEvent(${event.id})">Delete</button>
        <span class="event-badge">${event.category}</span>
        <h3>${escapeHtml(event.title)}</h3>
        <div class="event-info">
          📅 <strong>Date:</strong> ${event.date} | ⏰ <strong>Time:</strong> ${event.time} <br/>
          📍 <strong>Location:</strong> ${escapeHtml(event.location)}
        </div>
        ${event.desc ? `<p class="event-desc">${escapeHtml(event.desc)}</p>` : ''}
      </div>
    `;
  }).join('');
}

// Save to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('events', JSON.stringify(events));
}

// Basic sanitizer to avoid HTML injection
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
