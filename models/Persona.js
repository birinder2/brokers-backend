const mongoose = require("mongoose");
const QuestionSchema = new mongoose.Schema({
    questionKey: { type: String, required: true },
    questionText: { type: String, default: '' },
    questionOptions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    questionType: { type: String, required: true },
    rangeValue: { type: [Number], default: [] },
    inputPlaceholder: { type: String, default: '' },
    symbol: { type: [mongoose.Schema.Types.Mixed], default: [] },
    status: { type: String, default: 'active' },
    symbolPreFixOrPostFix: { type: String, default: '' },
    answer: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },{ timestamps: true});
  

  
  const PersonaPreferenceSchema = new mongoose.Schema({
    label: { type: String, required: true },
    icon: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    progress: { type: Number, default: 0 },
    questions: [QuestionSchema]
  }, { timestamps: true, collection: 'Persona' });
  
  
  
  
  const Persona = mongoose.model('Persona', PersonaPreferenceSchema);

  module.exports = Persona;