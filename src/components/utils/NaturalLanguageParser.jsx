import { addDays, addWeeks, addMonths, setHours, setMinutes, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, startOfDay } from 'date-fns';

export const parseNaturalLanguage = (input) => {
  const result = {
    date: null,
    time: null,
    priority: null,
    duration: null,
    effort: null,
    text: input
  };

  if (!input) return result;

  const lower = input.toLowerCase().trim();

  // Parse dates
  if (lower.includes('tomorrow')) {
    result.date = addDays(new Date(), 1);
  } else if (lower.includes('today')) {
    result.date = new Date();
  } else if (lower.match(/next (mon|tue|wed|thu|fri|sat|sun)/)) {
    const dayMap = {
      mon: nextMonday,
      tue: nextTuesday,
      wed: nextWednesday,
      thu: nextThursday,
      fri: nextFriday,
      sat: nextSaturday,
      sun: nextSunday
    };
    const match = lower.match(/next (mon|tue|wed|thu|fri|sat|sun)/);
    const dayFunc = dayMap[match[1]];
    if (dayFunc) result.date = dayFunc(new Date());
  } else if (lower.match(/in (\d+) days?/)) {
    const days = parseInt(lower.match(/in (\d+) days?/)[1]);
    result.date = addDays(new Date(), days);
  } else if (lower.match(/in (\d+) weeks?/)) {
    const weeks = parseInt(lower.match(/in (\d+) weeks?/)[1]);
    result.date = addWeeks(new Date(), weeks);
  }

  // Parse times (9am, 14:30, 3pm, etc.)
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3];

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    const baseDate = result.date || new Date();
    result.time = setMinutes(setHours(baseDate, hour), minute);
  }

  // Parse priority (P1, P2, P3 or high/medium/low)
  if (lower.match(/\bp1\b|high priority|urgent/)) {
    result.priority = 'high';
  } else if (lower.match(/\bp2\b|medium priority/)) {
    result.priority = 'medium';
  } else if (lower.match(/\bp3\b|low priority/)) {
    result.priority = 'low';
  }

  // Parse duration (~45m, 2h, 30min, etc.)
  const durationMatch = lower.match(/~?(\d+)\s*(m|min|mins|minutes?|h|hr|hrs|hours?)/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    
    if (unit.startsWith('h')) {
      result.duration = value * 60;
    } else {
      result.duration = value;
    }

    // Map duration to effort
    if (result.duration <= 15) result.effort = 'tiny';
    else if (result.duration <= 45) result.effort = 'small';
    else if (result.duration <= 120) result.effort = 'medium';
    else result.effort = 'large';
  }

  return result;
};

export const formatParsedPreview = (parsed) => {
  const parts = [];
  
  if (parsed.date) {
    parts.push(`📅 ${parsed.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
  }
  
  if (parsed.time) {
    parts.push(`🕐 ${parsed.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`);
  }
  
  if (parsed.priority) {
    parts.push(`⚡ ${parsed.priority} priority`);
  }
  
  if (parsed.duration) {
    parts.push(`⏱️ ${parsed.duration} min`);
  }
  
  if (parsed.effort) {
    parts.push(`📊 ${parsed.effort} effort`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : null;
};