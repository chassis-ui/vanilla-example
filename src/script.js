// What the page adds to the Chassis JavaScript. The components start from their `data-cx-*`
// attributes, in the bundle the page loads; this file holds the demos, which keep nothing
// and send nothing.

import { Dialog, Toast } from './vendor/js/chassis.bundle.min.js'

// One toast for every message of the page
const toast = document.getElementById('toast')

function notify(title, message) {
  document.getElementById('toast-title').textContent = title
  document.getElementById('toast-body').textContent = message
  Toast.getOrCreateInstance(toast).show()
}

// The section navigation. ScrollSpy marks the link of the section in view, and on a narrow
// screen NavOverflow moves the links that do not fit into a menu, as copies it makes again
// on every resize. ScrollSpy does not follow those copies, so the mark is set here, by the
// address of the link: on the link, on its copy, and on the toggle of the menu that holds it.
const sections = document.getElementById('sections')

document.body.addEventListener('activate.cx.scrollspy', (event) => {
  const { hash } = event.relatedTarget
  let inMenu = false

  for (const link of sections.querySelectorAll('[href]')) {
    link.classList.toggle('active', link.hash === hash)
    inMenu ||= link.hash === hash && link.classList.contains('menu-item')
  }

  sections.querySelector('.nav-overflow-toggle').classList.toggle('active', inMenu)
})

// The tokens of this build: an element with `data-computed` shows a computed style of the
// element that `data-of` selects, and of a font family the first name.
for (const output of document.querySelectorAll('[data-computed]')) {
  const style = getComputedStyle(document.querySelector(output.dataset.of))
  const value = style.getPropertyValue(output.dataset.computed)

  output.textContent = value.split(',')[0].replaceAll('"', '')
}

// Segments that switch a value: a click on a button of a `data-switch` group marks it as the
// pressed one, and every element with `data-by` of that group shows the text it has for the
// value of the button.
for (const group of document.querySelectorAll('[data-switch]')) {
  group.addEventListener('click', (event) => {
    const pressed = event.target.closest('[data-value]')

    if (!pressed) {
      return
    }

    for (const button of group.querySelectorAll('[data-value]')) {
      button.classList.toggle('active', button === pressed)
      button.setAttribute('aria-pressed', button === pressed)
    }

    for (const element of document.querySelectorAll(`[data-by="${group.dataset.switch}"]`)) {
      element.textContent = element.dataset[pressed.dataset.value]
    }
  })
}

// The projects table: the filter shows the rows of one status
const filter = document.getElementById('project-filter')
const projects = document.getElementById('projects')

filter.addEventListener('change', () => {
  const status = new FormData(filter).get('status')

  for (const row of projects.tBodies[0].rows) {
    row.hidden = status !== 'all' && row.dataset.status !== status
  }
})

// The drawer and the alert open from the menu of a row, and show the `data-field` texts of
// that row in their `data-detail` elements
let openRow = null

function showRow(event) {
  openRow = event.relatedTarget.closest('tr')

  for (const detail of event.target.querySelectorAll('[data-detail]')) {
    detail.textContent = openRow.querySelector(
      `[data-field="${detail.dataset.detail}"]`
    ).textContent
  }
}

document.getElementById('project-details').addEventListener('show.cx.drawer', showRow)
document.getElementById('delete-project').addEventListener('show.cx.dialog', showRow)

document.getElementById('delete-project-confirm').addEventListener('click', () => {
  const name = openRow.querySelector('[data-field="name"]').textContent

  openRow.remove()
  notify('Project deleted', `${name} is no longer in the table.`)
})

// The modal: the form is checked by the browser, then the dialog closes
const newProject = document.getElementById('new-project')
const newProjectForm = document.getElementById('new-project-form')

newProjectForm.addEventListener('submit', (event) => {
  const name = new FormData(newProjectForm).get('name')

  event.preventDefault()
  Dialog.getOrCreateInstance(newProject).hide()
  newProjectForm.reset()
  notify('Project created', `${name} would be in the table, if this demo kept anything.`)
})

// The contact form
document.getElementById('contact-form').addEventListener('submit', (event) => {
  event.preventDefault()
  notify('Request received', 'Nothing left this page: a real form would post it to a server.')
})
