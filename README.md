[![npm][npm]][npm-url]
[![node][node]][node-url]
[![tests][tests]][tests-url]
[![downloads][downloads]][downloads-url]

# mongoose-i18n-extra

[![Build Status](https://travis-ci.org/cme-pro/mongoose-i18n-extra.svg?branch=master)](https://travis-ci.org/cme-pro/mongoose-i18n-extra)
[![Code Climate](https://codeclimate.com/github/cme-pro/mongoose-i18n-extra/badges/gpa.svg)](https://codeclimate.com/github/cme-pro/mongoose-i18n-extra)


Mongoose schema plugin for multilingual fields, largely inspired by [mongoose-intl](https://github.com/alexsk/mongoose-intl) plugin.


There are several mongoose plugins dealing already with i18n, the most popular being [mongoose-intl](https://github.com/alexsk/mongoose-intl), but they all changing the translated field into a subdocument containning all translated value.

This plugin only add a new virtual field `_i18n` with all translations inside, except the default language, which is stored in the main translated field. It's easier to use on an existing database. No need to migrate all documents, you can use this plugin straighforward.

## Installation

```sh
$ npm install mongoose-i18n-extra --save
```

## Overview

### Adding plugin to the schema

Schema definition with `i18n` option enabled for some fields:

```js
const mongoose          = require('mongoose');
const mongooseI18nExtra = require('mongoose-i18n-extra');
const { Schema }        = mongoose;

var BlogPost = new Schema({
    title  : { type: String, i18n: true },
    body   : { type: String, i18n: true }
});

```
*Note:* `i18n` option can be enabled for String type only.

Adding plugin to the schema:

```js
BlogPost.plugin(mongooseI18nExtra, { languages: ['en', 'de', 'fr'], defaultLanguage: 'en' });
```

### Plugin options

* languages - required, array with languages, suggested to use 2- or 3-letters language codes using [ISO 639 standard](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
* defaultLanguage - optional, if omitted the first value from `languages` array will be used as a default language

### Database representation

`BlogPost` schema described above will be translated to the following document in the Mongo collection:

```js
{
    "_id": ObjectId(...),
    "title": "...",
    "body": "...",
    "_i18n": {
        "en": {"title": "...", "body": "..."},
        "de": {"title": "...", "body": "..."},
        "fr": {"title": "..., "body": "..."}"
    }
}
```

### Usage

`i18n`-enabled field is converted to a virtual path and continue interacting as a string, not an object.
It means that you can read it and write to it any string, and it will be stored under default language setting.

Other languages values can be set by using `model.set()` method. Pass an object with multiple languages instead of the string to set all values together. See examples below.

Multilingual fields can be set with 2 ways:

```js
var BlogPostModel = mongoose.model('Post', BlogPost);

var post = new BlogPostModel();

post.title = 'Title on default language'; // default language definition, will be stored to title

post.set('title_de', 'German title'); // any other language value definition will be stored to _i18n.de.title

// you can also set multiple value at once
post.set(
"_i18n": {
    "en": {"title": "...", "body": "..."},
    "de": {"title": "...", "body": "..."},
    "fr": {"title": "..., "body": "..."}"
});

await post.save();

```

Values can be read using the same options:

```js
var BlogPostModel = mongoose.model('Post', BlogPost);

const post = await BlogPostModel.findOne({...});

console.log(post.title); // 'Title on default language'
console.log(post.get('title_de')); // 'Another German title'
```

This plugin is also compliant with the plugin [mongoose-lean-virtuals](https://github.com/vkarpov15/mongoose-lean-virtuals) which exposes the virtual fields:
```js
const post = await BlogPostModel.findOne({...}).lean({virtuals: ['_i18n']});

console.log(post.title); // 'Title on default language'
console.log(post._i18n); // { "de": {description: "..."}, "en": {"description": "..."}, "fr": {description: "..."} }
```

### Language methods

The current language can be set/changed on 1 level for the moment:
* Document level: affects only some document (each particular model instance)

#### Document level

Each document will receive the following language methods:
* `getLanguages()` - returns an array of available languages
* `getLanguage()` - returns current document's language
* `setLanguage(lang)` - changes document's language to a new one, the value should be equal to the one of available languages
* `unsetLanguage()` - removes previously set document-specific language, schema's default language will be used for the translation

Usage examples:

```js
const posts = await BlogPostModel.find({});

  console.log(JSON.stringify(posts)); // [{ _id: '...', title: 'Title 1 on default language' },
                                      //  { _id: '...', title: 'Title 2 on default language' }, ...]

  posts[0].getLanguages(); // [ 'en', 'de', 'fr' ]
  posts[0].getLanguage(); // 'en'

  posts[0].setLanguage('de');
  console.log(JSON.stringify(posts)); // [{ _id: '...', title: 'Another German title' },
                                      //  { _id: '...', title: 'Title 2 on default language' }, ...]

  BlogPostModel.setDefaultLanguage('fr'); // schema-level language change (see documentation below)
  console.log(JSON.stringify(posts)); // [{ _id: '...', title: 'Another German title' }, // still 'de'
                                      //  { _id: '...', title: 'French title 2' }, ...]

  posts[0].unsetLanguage();
  console.log(JSON.stringify(posts)); // [{ _id: '...', title: 'French title 1' },
                                      //  { _id: '...', title: 'French title 2' }, ...]
});
```

### Intl-based String type options

[`default`](http://mongoosejs.com/docs/api.html#schematype_SchemaType-default) and [`required`](http://mongoosejs.com/docs/api.html#schematype_SchemaType-required) options are applied to the default language field only.

2 new options were added for all lang-fields: `defaultAll` and `requiredAll`.

Example:

```js
var BlogPost = new Schema({
    title  : { type: String, i18n: true, default: 'Some default title', requiredAll: true },
    body   : { type: String, i18n: true }
});
```

All others options and validators (e.g. `lowercase`, `uppercase`, `trim`, `minlength`, `maxlength`, `match`, etc.) will be used for all languages.
But please be careful with some of them like `enum` which may not be relevant for multilingual text fields, and indexes which will be added for all fields as well.


### TODO

* define as a global plugin which will be applied to all schemas.
* set language at schema level
* set language at connection level

## Alternative plugins

* [mongoose-intl](https://github.com/alexsk/mongoose-intl)


[npm]: https://img.shields.io/npm/v/mongoose-i18n-extra.svg
[npm-url]: https://npmjs.com/package/mongoose-i18n-extra
[node]: https://img.shields.io/node/v/mongoose-i18n-extra.svg
[node-url]: https://nodejs.org
[tests]: http://img.shields.io/travis/cme-pro/mongoose-i18n-extra.svg
[tests-url]: https://travis-ci.org/cme-pro/mongoose-i18n-extra
[downloads]: https://img.shields.io/npm/dt/mongoose-i18n-extra.svg
[downloads-url]: https://npmjs.com/package/mongoose-i18n-extra
