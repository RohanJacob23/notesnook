/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// type MimeTypeInfo = {
//   source: string;
//   extensions?: string[];
//   charset?: string;
//   compressible?: boolean;
// };

let db; // : Record<string, MimeTypeInfo>;

/**
 *
 * @param {string} filename
 * @param {string | undefined} mime
 * @returns {string}
 */
export function getFileNameWithExtension(filename, mime) {
  if (!mime || mime === "application/octet-stream") return filename;
  if (!db) db = require("mime-db");
  const mimeData = db[mime];
  if (!mimeData || !mimeData.extensions || mimeData.extensions.length === 0)
    return filename;
  const extension = mimeData.extensions[0];

  if (mimeData.extensions.some((extension) => filename.endsWith(extension)))
    return filename;

  return `${filename}.${extension}`;
}
