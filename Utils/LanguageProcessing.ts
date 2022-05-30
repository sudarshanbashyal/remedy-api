// @ts-ignore
import { dockStart } from "@nlpjs/basic";

// train ML model for NLP
export const trainModel = async () => {
	const dock = await dockStart({ use: ["Basic"] });
	const nlp = dock.get("nlp");
	nlp.addLanguage("en");

	// greetings intent
	nlp.addDocument("en", "hello", "greetings.hello");
	nlp.addDocument("en", "hi", "greetings.hello");
	nlp.addDocument("en", "howdy", "greetings.hello");
	nlp.addDocument("en", "yo", "greetings.hello");
	nlp.addDocument("en", "what's up", "greetings.hello");
	nlp.addDocument("en", "how are you", "greetings.hello");

	// goodbye intent
	nlp.addDocument("en", "goodbye for now", "greetings.bye");
	nlp.addDocument("en", "bye bye take care", "greetings.bye");
	nlp.addDocument("en", "okay see you later", "greetings.bye");
	nlp.addDocument("en", "bye for now", "greetings.bye");
	nlp.addDocument("en", "i must go", "greetings.bye");
	nlp.addDocument("en", "catch you around", "greetings.bye");

	// symptom intent
	nlp.addDocument("en", "i think i have fever", "symptom");
	nlp.addDocument("en", "i have fever", "symptom");
	nlp.addDocument("en", "i am suffering from fever", "symptom");
	nlp.addDocument("en", "my head hurts", "symptom");
	nlp.addDocument("en", "i have been feeling weak lately", "symptom");
	nlp.addDocument("en", "coughing", "symptom");
	nlp.addDocument("en", "sneezing", "symptom");
	nlp.addDocument("en", "i caught a cold", "symptom");
	nlp.addDocument("en", "body pain", "symptom");
	nlp.addDocument("en", "sore throat", "symptom");
	nlp.addDocument("en", "anxiety", "symptom");
	nlp.addDocument("en", "nausea", "symptom");
	nlp.addDocument("en", "dizzy", "symptom");
	nlp.addDocument("en", "i feel dizzy", "symptom");

	// positive intents
	nlp.addDocument("en", "yes", "reaction.positive");
	nlp.addDocument("en", "that is correct", "reaction.positive");
	nlp.addDocument("en", "you are correct", "reaction.positive");
	nlp.addDocument("en", "precisely", "reaction.positive");
	nlp.addDocument("en", "yep", "reaction.positive");
	nlp.addDocument("en", "i do", "reaction.positive");
	nlp.addDocument("en", "indeed", "reaction.positive");
	nlp.addDocument("en", "exactly", "reaction.positive");
	nlp.addDocument("en", "think so", "reaction.positive");

	// negative intents
	nlp.addDocument("en", "no", "reaction.negative");
	nlp.addDocument("en", "nope", "reaction.negative");
	nlp.addDocument("en", "i dont", "reaction.negative");
	nlp.addDocument("en", "incorrect", "reaction.negative");
	nlp.addDocument("en", "that is not the case", "reaction.negative");
	nlp.addDocument("en", "not really", "reaction.negative");
	nlp.addDocument("en", "don't think so", "reaction.negative");

	// hosital intents;
	nlp.addDocument(
		"en",
		"Show me hospitals specialized for cancer",
		"intent.hospital"
	);
	nlp.addDocument(
		"en",
		"What hospitals are specialized for cancer?",
		"intent.hospital"
	);
	nlp.addDocument("en", "Hospitals for Cancer", "intent.hospital");
	nlp.addDocument("en", "Where are hospitals for cancer", "intent.hospital");
	nlp.addDocument("en", "cancer hospital", "intent.hospital");
	nlp.addDocument(
		"en",
		"show me direction to cancer hospital",
		"intent.hospital"
	);

	// answers for greetings and goodbye intents
	// the answers for symptom intent will be generated based on user input
	nlp.addAnswer("en", "greetings.bye", "Till next time");
	nlp.addAnswer("en", "greetings.bye", "see you soon!");
	nlp.addAnswer("en", "greetings.bye", "Alright then! see ya!");
	nlp.addAnswer(
		"en",
		"greetings.hello",
		"Hey there! Please tell me your symptoms."
	);
	nlp.addAnswer(
		"en",
		"greetings.hello",
		"Greetings! You can start by telling me your symptom."
	);

	await nlp.train();

	return nlp;
};
