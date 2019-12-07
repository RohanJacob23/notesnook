import Storage from "../helpers/storage";
import fuzzysearch from "fuzzysearch";
import ff from "fast-filter";
import { extractValues } from "../utils";

const KEYS = {
  notes: "notes",
  notebooks: "notebooks"
};

class Database {
  constructor(storage) {
    this.storage = new Storage(storage);
    this.notes = {};
    this.notebooks = {};

    // fill data
    for (let key of extractValues(KEYS)) {
      this.storage.read(key).then(data => (this[key] = data || {}));
    }
  }

  /**
   * Get all notes
   */
  getNotes() {
    return extractValues(this.notes);
  }

  /**
   * Adds or updates a note
   * @param {object} note The note to add or update
   */
  async addNote(note) {
    if (
      !note ||
      (!note.title &&
        (!note.content || !note.content.text || !note.content.delta))
    )
      return;

    let timestamp = note.dateCreated || Date.now();
    //add or update a note into the database
    let title =
      note.title ||
      note.content.text
        .split(" ")
        .slice(0, 3)
        .join(" ");
    this.notes[timestamp] = {
      type: "note",
      title,
      content: note.content,
      pinned: note.pinned || false,
      tags: note.tags || [],
      notebooks: note.notebooks || {},
      colors: note.colors || [],
      favorite: note.favorite || false,
      headline:
        note.content.text.substring(0, 150) +
        (note.content.text.length > 150 ? "..." : ""),
      length: note.content.text.length,
      dateEditted: Date.now(),
      dateCreated: timestamp
    };
    await this.storage.write(KEYS.notes, this.notes);
    return timestamp;
  }

  /**
   * Deletes one or more notes
   * @param {array} notes the notes to be deleted
   */
  async deleteNotes(notes) {
    return await deleteItems.call(this, notes, KEYS.notes);
  }

  /**
   * Gets a note
   * @param {string} id the id of the note (must be a timestamp)
   */
  getNote(id) {
    return getItem.call(this, id, KEYS.notes);
  }

  /**
   * Searches all notes with the given query
   * @param {string} query the search query
   * @returns An array containing the filtered notes
   */
  searchNotes(query) {
    if (!query) return [];
    return ff(
      extractValues(this.notes),
      v => fuzzysearch(query, v.title + " " + v.content.text),
      this
    );
  }

  /**
   * Get all notebooks
   * @returns An array containing all the notebooks
   */
  getNotebooks() {
    return extractValues(this.notebooks);
  }

  /**
   * Add a notebook
   * @param {object} notebook The notebook to add
   * @returns The ID of the added notebook
   */
  async addNotebook(notebook) {
    if (!notebook || !notebook.title) {
      return;
    }
    if (
      extractValues(this.notebooks).findIndex(
        nb => nb.title === notebook.title
      ) > -1
    ) {
      return;
    }

    const id = notebook.dateCreated || Date.now();
    let topics = [makeTopic("General")];
    for (let topic of notebook.topics) {
      if (
        !topic ||
        topic.trim().length <= 0 ||
        topics.findIndex(t => t.title === topic) > -1 //check for duplicate
      )
        continue;
      topics[topics.length] = makeTopic(topic);
    }

    this.notebooks[id] = {
      type: "notebook",
      title: notebook.title,
      description: notebook.description,
      dateCreated: id,
      pinned: notebook.pinned || false,
      favorite: notebook.favorite || false,
      topics,
      totalNotes: 0,
      tags: [],
      colors: []
    };
    await this.storage.write(KEYS.notebooks, this.notebooks);
    return id;
  }

  /**
   * Add a topic to the notebook
   * @param {number} notebookId The ID of notebook
   * @param {string} topic The topic to add
   */
  addTopicToNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      if (notebook.topics.findIndex(t => t.title === topic) > -1) return false; //check for duplicates
      notebook.topics[notebook.topics.length] = makeTopic(topic);
      return true;
    });
  }

  /**
   * Delete a topic from the notebook
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic to delete
   */
  deleteTopicFromNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      let topicIndex = notebook.topics.findIndex(t => t.title === topic);
      if (topicIndex === -1) return false;
      notebook.topics.splice(topicIndex, 1);
      return true;
    });
  }

  /**
   * Add a note to a topic in a notebook
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic to add note to
   * @param {number} noteId The ID of the note
   */
  addNoteToTopic(notebookId, topic, noteId) {
    return topicNoteFn.call(
      this,
      notebookId,
      topic,
      noteId,
      (notebook, topicIndex) => {
        if (notebook.topics[topicIndex].notes.indexOf(noteId) > -1)
          return false; //duplicate check
        notebook.topics[topicIndex].notes.push(noteId);
        //increment totalNotes count
        notebook.topics[topicIndex].totalNotes++;
        notebook.totalNotes++;
        //add notebookId to the note
        this.notes[noteId].notebooks[notebookId] = notebook.title;
        return true;
      }
    );
  }

  /**
   * Delete a note from a topic in a notebook
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic to delete note from
   * @param {number} noteId The ID of the note
   */
  deleteNoteFromTopic(notebookId, topic, noteId) {
    return topicNoteFn.call(
      this,
      notebookId,
      topic,
      noteId,
      async (notebook, topicIndex) => {
        let index = notebook.topics[topicIndex].notes.indexOf(noteId);
        if (index <= -1) return false;
        notebook.topics[topicIndex].notes.splice(index, 1);
        //delete notebook from note
        delete this.notes[noteId].notebooks[notebookId];
        //decrement totalNotes count
        notebook.topics[topicIndex].totalNotes--;
        notebook.totalNotes--;
        return true;
      }
    );
  }

  /**
   * Get all the notes in a topic
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic
   * @returns An array containing the topic notes
   */
  getTopic(notebookId, topic) {
    if (!notebookId || !topic || !this.notebooks[notebookId]) return;
    let notebook = this.notebooks[notebookId];
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    if (topicIndex === -1) return;
    let nbTopic = notebook.topics[topicIndex];
    if (nbTopic.notes.length <= 0) return [];
    return nbTopic.notes.map(note => this.getNote(note));
  }

  /**
   * Get a notebook
   * @param {number} id The ID of the notebook
   * @returns The notebook
   */
  getNotebook(id) {
    return getItem.call(this, id, KEYS.notebooks);
  }

  /**
   * Delete notebooks
   * @param {array} notebooks The notebooks to delete
   */
  async deleteNotebooks(notebooks) {
    return await deleteItems.call(this, notebooks, KEYS.notebooks);
  }

  async moveNote(noteId, from, to) {
    if (
      !noteId ||
      !from ||
      !to ||
      !from.notebook ||
      !to.notebook ||
      !from.topic ||
      !to.topic ||
      from.notebook === to.notebook //moving to same notebook shouldn't be possible
    )
      return false;
    if (await this.deleteNoteFromTopic(from.notebook, from.topic, noteId)) {
      return await this.addNoteToTopic(to.notebook, to.topic, noteId);
    }
    return false;
  }
}

export default Database;

function deleteItems(items, key) {
  if (!items || items.length <= 0 || !this[key] || this[key].length <= 0)
    return false; //TODO add test
  for (let item of items) {
    if (!item) continue;
    if (this[key].hasOwnProperty(item.dateCreated)) {
      delete this[key][item.dateCreated];
    }
  }
  return this.storage.write(key, this[key]).then(s => true);
}

function notebookTopicFn(notebookId, topic, fn) {
  if (!notebookId || !topic || !this.notebooks[notebookId]) return false;
  const notebook = this.notebooks[notebookId];
  const result = fn(notebook);
  if (result === true) {
    this.notes[notebookId] = notebook;
    return this.storage.write(KEYS.notebooks, this.notebooks).then(s => true);
  }
  //TODO add test
  return result;
}

function topicNoteFn(notebookId, topic, noteId, fn) {
  return notebookTopicFn.call(this, notebookId, topic, notebook => {
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    if (topicIndex === -1 || !this.notes.hasOwnProperty(noteId)) return false;

    if (fn(notebook, topicIndex)) {
      return this.storage.write(KEYS.notes, this.notes).then(s => true);
    }
    return false;
  });
}

function getItem(id, key) {
  if (this[key].hasOwnProperty(id)) {
    return this[key][id];
  }
}

function makeTopic(topic) {
  return {
    type: "topic",
    title: topic,
    dateCreated: Date.now(),
    totalNotes: 0,
    notes: []
  };
}
