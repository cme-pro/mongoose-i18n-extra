import {Schema} from "mongoose";
import mpath from 'mpath';

interface Options {
    defaultLanguage: string;
    languages: string[];
}
export default function mongooseI18nExtra(schema: Schema, options: Options): void {

  const i18nFields: string[] = [];

  schema.eachPath(function (path: string, schemaType: any) {
      if (!schemaType.options.i18n) {
        return;
      }
         i18nFields.push(path);
      options.languages.forEach(lang => {
        schema
          .virtual(`${path}_${lang}`)
          .get(function(this: any) {
            const key = (lang === options.defaultLanguage) ? path : `_i18n.${lang}.${path}`;
            return this.getValue ? this.getValue(key) : mpath.get(key, this, '_doc');
          })
          .set(function (this: any, value: string) {
            if (lang === options.defaultLanguage) {
              // note: here path is a vitual field, so we set directly the value
              this.setValue(path, value);
              this.markModified(path);
            } else {
              this.set(`_i18n.${lang}.${path}`, value);
            }
          });
      });
      schemaType.options.get = function (value:any) {
        if (this.getLanguage() === options.defaultLanguage) {
          return value;
        } else {
          return this.get(`_i18n.${this.getLanguage()}.${path}`);
        }
      }
      schemaType.options.set = function (value: String) {
        const currentLang = this.getLanguage();
        if (currentLang === options.defaultLanguage) {
          return value;
        } else {
          const _i18n = this.getValue('_i18n') || {};
          _i18n[currentLang] = _i18n[currentLang]||{};
          _i18n[currentLang][path] = value;
          this.setValue('_i18n', _i18n);
          this.markModified('_i18n');
          // set the value for the default language, if none exists
          const defaultValue = this.getValue(path);
          return (this.isNew && !defaultValue) ? value : defaultValue;
        }
      }
      schema.remove(path);
      schema.add({[path]: schemaType.options});
  });

  schema
    .virtual(`_i18n`)
    .get(function(this: any) {
      const value = (this.getValue ? this.getValue('_i18n') : this['_i18n']) || {};
      const self = this;
      value[options.defaultLanguage] = {};
      i18nFields.forEach(function(fieldName) {
        options.languages.forEach(lang => {
          value[lang] = value[lang] || {};
          value[lang][fieldName] = value[lang][fieldName] || null;
        });
        value[options.defaultLanguage][fieldName] = (self.getValue) ? self.getValue(fieldName) : self[fieldName];
      });
        //value[options.defaultLanguage][path] = this.getValue ? this.getValue(path) : this[path];
      return value;
    })
    .set(function (this: any, value: any) {
      const self = this;
      if (value[options.defaultLanguage]) {
        // note: here path is a vitual field, so we set directly the value
        Object.keys(value[options.defaultLanguage]).forEach(function(key) {
          self.setValue(key, value[options.defaultLanguage][key]);
          self.markModified(key);
        });
        delete value[options.defaultLanguage];
      }
      this.setValue('_i18n', value);
      this.markModified('_i18n');
    });


  schema.method({
    getLanguages: function (this: any) {
      return options.languages;
    },
    getLanguage: function (this: any) {
      return this.docLanguage || options.defaultLanguage;
    },
    setLanguage: function (this: any, lang: String) {
      if (lang && this.getLanguages().includes(lang)) {
        this.docLanguage = lang;
      }
    },
    unsetLanguage: function () {
      delete this.docLanguage;
    },
  });
}
