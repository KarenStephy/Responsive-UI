# Book & Notes Vault

Book & Notes Vault is a vanilla HTML, CSS, and JavaScript web app for cataloging books, lecture notes, research materials, and study resources. It is built to satisfy the rubric requirements for semantic structure, responsive layout, regex validation, live search, persistence, dashboard stats, accessibility, and modular code.

## Theme

Chosen theme: `Book & Notes Vault`

This theme works especially well for the assignment because it naturally supports title fields, page counts, tags, date tracking, regex search, sorting, statistics, import/export, and accessible editing flows.

## Pages

- `index.html` - Dashboard and About
- `records.html` - Search, sort, and inline edit/delete
- `form.html` - Add new records with validation feedback
- `settings.html` - Reading target, unit settings, import/export

## Live Demo

GitHub Pages URL: `https://your-username.github.io/your-repo-name/`

Replace the placeholder above with your published GitHub Pages link before submission.

## Features

- Semantic layout with `header`, `nav`, `main`, `section`, and `footer`.
- Mobile-first responsive design with a desktop table and mobile cards.
- Regex validation for title, pages, date, and tag inputs.
- Advanced regex warning for repeated words in titles.
- Live regex search with safe compilation and highlighted matches.
- Sorting by title, pages, and date.
- Dashboard statistics for total records, total pages, top tag, and last 7 days of additions.
- Reading target progress with polite and assertive ARIA updates.
- LocalStorage persistence with export and import of JSON data.
- Inline edit and delete actions with timestamp updates.
- Keyboard-friendly controls, skip link, visible focus states, and live regions.

## Data Model

Each record uses this shape:

```json
{
  "id": "book_0001",
  "title": "JavaScript Essentials",
  "author": "John Doe",
  "pages": 350,
  "tag": "Programming",
  "dateAdded": "2025-09-29",
  "createdAt": "2025-09-29T10:00:00Z",
  "updatedAt": "2025-09-29T10:00:00Z"
}
```

## Regex Catalog

| Purpose | Pattern | Example valid input |
| --- | --- | --- |
| Title validation | `/^\S(?:.*\S)?$/` | `JavaScript Guide` |
| Pages validation | `/^(0|[1-9]\d*)(\.\d{1,2})?$/` | `250` or `999.99` |
| Date validation | `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/` | `2025-09-29` |
| Tag validation | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `Computer Science` |
| Duplicate word detection | `/\b(\w+)\s+\1\b/i` | `Java Java Basics` |

## Keyboard Map

| Key | Action |
| --- | --- |
| `Tab` | Move forward through controls |
| `Shift+Tab` | Move backward through controls |
| `Enter` | Submit forms and save edits |
| `Space` | Activate buttons and checkboxes |
| `Escape` | Cancel inline editing |

## Accessibility Notes

- Skip-to-content link appears at the top of the page.
- Visible focus outlines are enabled for interactive elements.
- Form controls are labeled and grouped for screen readers.
- Status messages use `role="status"` and `aria-live`.
- Validation feedback is announced without breaking keyboard flow.
- Color contrast is kept high for readability.
- Mobile and desktop layouts are both supported without framework dependencies.

## How To Run

1. Open `index.html` directly in a browser, or serve the folder with a local static server.
2. Use the app to add, edit, search, sort, import, and export records.
3. Open `tests.html` to run the regex assertions.

Example local server:

```bash
python -m http.server 8000
```

## Tests

`tests.html` includes basic assertions for:

- title validation
- pages validation
- tag validation
- duplicate word detection
- safe regex compilation
- match highlighting

Open the page in a browser and check the console for `console.assert` output.

## Project Structure

```text
book-notes-vault/
|-- index.html
|-- records.html
|-- form.html
|-- settings.html
|-- README.md
|-- seed.json
|-- tests.html
|-- styles/
|-- scripts/
`-- assets/
```

## Files

- `index.html` - dashboard and about page
- `records.html` - browsing and inline editing page
- `form.html` - add record page
- `settings.html` - settings page
- `styles/` - responsive styling and component styles
- `scripts/` - validators, storage, state, stats, search, UI, and app bootstrap
- `tests.html` - lightweight assertion page
- `seed.json` - 10 sample records with edge cases

## Submission Checklist

- Book & Notes Vault theme selected
- Responsive semantic UI completed
- Regex validation and live search implemented
- Dashboard stats and reading target included
- JSON import/export and localStorage persistence included
- Keyboard and accessibility features documented
- `tests.html` added
- `seed.json` includes at least 10 records
- GitHub Pages link added above

## Notes

- The app uses no frameworks.
- Seed data is stored in `seed.json` and also loaded into the app through `scripts/seed-data.js`.
- Replace the placeholder GitHub and email links in `index.html` with your real contact details before submitting.
