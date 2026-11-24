// Профили и прогресс (хранится на устройстве)
const KEY = 'propisi.v1';
let state = { profiles: [], current: null, sound: true, voice: true };
try { const raw = localStorage.getItem(KEY); if (raw) state = { ...state, ...JSON.parse(raw) }; } catch { /* нет доступа к хранилищу */ }

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* пропускаем */ } };

export const store = {
  get state() { return state; },
  get profile() { return state.profiles.find(p => p.id === state.current) || null; },
  addProfile({ name, age, avatar }) {
    const p = { id: Date.now().toString(36), name, age, avatar, stars: {}, color: '#2b3fbf', size: 0 };
    state.profiles.push(p); state.current = p.id; save(); return p;
  },
  update(patch) { Object.assign(this.profile, patch); save(); },
  select(id) { state.current = id; save(); },
  remove(id) { state.profiles = state.profiles.filter(p => p.id !== id); if (state.current === id) state.current = null; save(); },
  setStars(lessonId, n) { const p = this.profile; if (!p) return; p.stars[lessonId] = Math.max(p.stars[lessonId] || 0, n); save(); },
  resetProgress() { this.profile.stars = {}; save(); },
  totalStars(p = this.profile) { return Object.values(p.stars).reduce((a, b) => a + b, 0); },
  set(key, v) { state[key] = v; save(); },
};
