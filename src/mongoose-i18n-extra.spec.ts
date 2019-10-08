/* eslint-env jest */
import mongoose from "mongoose";
import mongooseI18nExtra from "./mongoose-i18n-extra";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const { Schema } = mongoose;

let sampleId = mongoose.Types.ObjectId().toString();
let Sample: any;

describe("Plugin mongooseI18nExtra", () => {
  beforeAll(async () => {
    await mongoose.connect("mongodb://localhost:27017/mongoose-i18n", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const schema = new Schema(
      {
        name: { type: String },
        description: { type: String, i18n: true }
      },
      {
        strict: "throw"
      }
    );

    schema.plugin(mongooseI18nExtra, {
      languages: ["en", "de", "fr"],
      defaultLanguage: "en"
    });
    schema.plugin(mongooseLeanVirtuals);
    Sample = mongoose.model("Sample", schema);
  });

  describe("Create / update", () => {
    test("should be able to create a document with i18n fields", async () => {
      let sample = new Sample({
        _id: sampleId,
        name: "test",
        description: "desc en"
      });
      expect(sample._id.toString()).toBe(sampleId.toString());
      await sample.save();

      sample = await Sample.findById(sampleId);

      expect(sample.name).toBe("test");
      expect(sample.description).toBe("desc en");
      expect(sample.get("description")).toBe("desc en");
      expect(sample.get("description_en")).toBe("desc en");
      expect(sample._i18n).toEqual({
        de: { description: null },
        en: { description: "desc en" },
        fr: { description: null }
      });
    });

    test("should be able to update a document with i18n fields", async () => {
      let sample = await Sample.findById(sampleId);
      sample.setLanguage("fr");
      expect(sample.getLanguage()).toBe("fr");
      sample.description = "desc fr";
      await sample.save();

      sample = await Sample.findById(sampleId);
      sample.setLanguage("fr");
      expect(sample.name).toBe("test");
      expect(sample.description).toBe("desc fr");
      expect(sample.get("description")).toBe("desc fr");
      expect(sample.get("description_en")).toBe("desc en");
      expect(sample.get("description_fr")).toBe("desc fr");
      expect(sample._i18n).toEqual({
        de: { description: null },
        en: { description: "desc en" },
        fr: { description: "desc fr" }
      });

      sample.set({ description: "desc2 fr" });

      await sample.save();
      sample = await Sample.findById(sampleId);
      sample.setLanguage("fr");
      expect(sample.description).toBe("desc2 fr");
      sample.setLanguage("en");
      expect(sample.description).toBe("desc en");
    });
  });

  test("should be able to update a document with i18n fields using findOneAndUpdate", async () => {
    await Sample.findOneAndUpdate(
      { _id: sampleId },
      {
        $set: {
          name: "name with findOneAndUpdate",
          description: "desc en with findOneAndUpdate"
        }
      },
      { strict: true }
    );

    let sample = await Sample.findById(sampleId);
    sample.setLanguage("en");
    expect(sample.name).toBe("name with findOneAndUpdate");
    expect(sample.description).toBe("desc en with findOneAndUpdate");

    expect(sample.get("description_fr")).toBe("desc2 fr");
    expect(sample._i18n).toEqual({
      de: { description: null },
      en: { description: "desc en with findOneAndUpdate" },
      fr: { description: "desc2 fr" }
    });
  });

  test("should set default value if not default value is empty", async () => {
    let sample = new Sample();
    sample.setLanguage("fr");
    sample.set({ description: "test fr" });
    await sample.save();

    sample = await Sample.findById(sample._id);

    sample.setLanguage("en");
    expect(sample.description).toBe("test fr");
    expect(sample._i18n).toEqual({
      de: { description: null },
      en: { description: "test fr" },
      fr: { description: "test fr" }
    });
  });

  test("should set default value if not default value is empty", async () => {
    let sample = new Sample();
    sample.description = "test en";
    sample.set({
      _i18n: {
        fr: { description: "test fr" },
        de: { description: "test de" }
      }
    });
    await sample.save();

    sample = await Sample.findById(sample._id).lean({ virtuals: true });
    expect(sample).toEqual({
      _id: sample._id,
      id: sample._id.toString(),
      __v: sample.__v,
      description: "test en",
      description_fr: "test fr",
      description_en: "test en",
      description_de: "test de",
      _i18n: {
        fr: { description: "test fr" },
        en: { description: "test en" },
        de: { description: "test de" }
      }
    });
  });

  test("should support multiple translations", async () => {
    let sample = new Sample();
    sample.setLanguage("fr");
    sample.set({
      _i18n: {
        fr: { description: "test fr" },
        en: { description: "test en" },
        de: { description: "test de" }
      }
    });

    await sample.save();

    sample = await Sample.findById(sample._id);
    expect(sample.description).toEqual("test en");
    expect(sample._i18n.en.description).toEqual("test en");
    expect(sample._i18n.fr.description).toEqual("test fr");
    expect(sample._i18n.de.description).toEqual("test de");
    expect(sample.get("description_fr")).toEqual("test fr");
    expect(sample.get("description_en")).toEqual("test en");
    expect(sample.get("description_de")).toEqual("test de");

    const valueStoredInDatabase = {
      _id: sample._id,
      __v: sample.__v,
      description: "test en"
    };

    const i18nValuesInDatabase = {
      de: { description: "test de" },
      en: { description: null },
      fr: { description: "test fr" }
    };

    const i18nValuesWithGetter = {
      ...i18nValuesInDatabase,
      en: { description: "test en" }
    };

    const virtualFields = {
      description_fr: "test fr",
      description_en: "test en",
      description_de: "test de"
    };

    expect(sample.toJSON()).toEqual({
      ...valueStoredInDatabase,
      _i18n: i18nValuesWithGetter
    });
    expect(sample.toObject({ getters: true })).toEqual({
      ...valueStoredInDatabase,
      id: sample._id.toString(),
      _i18n: i18nValuesWithGetter,
      ...virtualFields
    });
    expect(sample.toObject({ virtuals: true })).toEqual({
      ...valueStoredInDatabase,
      id: sample._id.toString(),
      _i18n: i18nValuesWithGetter,
      ...virtualFields
    });

    expect(sample._i18n).toEqual({
      de: { description: "test de" },
      en: { description: "test en" },
      fr: { description: "test fr" }
    });

    sample.set({
      _i18n: {
        fr: { description: "test fr2" },
        en: { description: "test en2" },
        de: { description: "test de2" }
      }
    });

    await sample.save();

    sample = await Sample.findById(sample._id);
    expect(sample.description).toEqual("test en2");
    expect(sample._i18n.en.description).toEqual("test en2");
    expect(sample._i18n.fr.description).toEqual("test fr2");
    expect(sample._i18n.de.description).toEqual("test de2");
    expect(sample.get("description_fr")).toEqual("test fr2");
    expect(sample.get("description_en")).toEqual("test en2");
    expect(sample.get("description_de")).toEqual("test de2");
    expect(sample._i18n).toEqual({
      de: { description: "test de2" },
      en: { description: "test en2" },
      fr: { description: "test fr2" }
    });
  });
});
