// Use the published weekly schedule and Stuttgart time, wherever visitors are.
(() => {
  const dot = document.querySelector('.badge-dot');
  if (!dot) return;
  const meetings = [...document.querySelectorAll('[data-meeting-day]')];
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', weekday: 'short',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function updateMeetingStatus() {
    const parts = Object.fromEntries(clock.formatToParts(new Date()).map(part => [part.type, part.value]));
    const day = String(weekdays.indexOf(parts.weekday));
    const time = `${parts.hour}:${parts.minute}`;
    let anyActive = false;
    for (const meeting of meetings) {
      const { dataset } = meeting;
      const active = dataset.meetingDay === day && time >= dataset.meetingStart && time < dataset.meetingEnd;
      meeting.classList.toggle('meeting-active', active);
      anyActive ||= active;
    }
    dot.hidden = !anyActive;
  }

  updateMeetingStatus();
  // Align updates to minute boundaries so an open page follows start/end times.
  setTimeout(() => {
    updateMeetingStatus();
    setInterval(updateMeetingStatus, 60_000);
  }, 60_000 - Date.now() % 60_000);
  document.addEventListener('visibilitychange', updateMeetingStatus);
  window.addEventListener('pageshow', updateMeetingStatus);
})();
