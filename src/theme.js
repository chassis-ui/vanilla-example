// The theme of the page: light, dark, or the default, which follows the system. Chassis CSS
// reads it from the `data-cx-theme` attribute of <html>, and no attribute is the default.
//
// The page loads this file without `defer`, so a saved theme is applied before the first
// paint. The choice is kept in localStorage; where the browser blocks it, the choice lasts
// until the page is left.

const THEME_KEY = 'theme'
const THEMES = ['light', 'dark']

function savedTheme() {
  try {
    return localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

function saveTheme(theme) {
  try {
    if (theme) {
      localStorage.setItem(THEME_KEY, theme)
    } else {
      localStorage.removeItem(THEME_KEY)
    }
  } catch {
    // Nothing to do: the attribute is set, the choice is not kept
  }
}

function applyTheme(theme) {
  if (THEMES.includes(theme)) {
    document.documentElement.dataset.cxTheme = theme
  } else {
    delete document.documentElement.dataset.cxTheme
  }
}

applyTheme(savedTheme())

// The theme menu: an item per theme, with the theme in `data-theme`. The item of the
// default has an empty value.
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('[data-theme]')

  function select(theme) {
    for (const item of items) {
      const selected = item.dataset.theme === theme
      item.classList.toggle('selected', selected)
      item.setAttribute('aria-checked', selected)
    }
  }

  for (const item of items) {
    item.addEventListener('click', () => {
      applyTheme(item.dataset.theme)
      saveTheme(item.dataset.theme)
      select(item.dataset.theme)
    })
  }

  select(document.documentElement.dataset.cxTheme ?? '')
})
