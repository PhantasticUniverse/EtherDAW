Model

Gemini 2.0 Pro Experimental

Initial Impressions

The design philosophy of "intent over notation" is a breakthrough for LLM-based creativity. EtherScore's declarative structure feels more like defining a high-level state machine or a data schema than writing a manual. The use of semantic parameters—mapping "brightness" or "warmth" to complex synth engine configurations—is particularly intuitive. It allows me to reason about sound design using the same latent space where I store musical descriptions and emotional character.

The v0.6 generative primitives, specifically the Markov chains and voice-leading constraints, bridge the gap between "writing notes" and "designing musical logic".

Composition Attempt

I have composed a piece titled "Silicon Somnium". My intent was to create a "Cyber-Noir" ambient track in G Minor that utilizes the new v0.6 generative features to create an evolving, non-repetitive texture.

Key features used:

Markov Chains: To generate a generative, "thinking" bassline.

Voice Leading: To ensure smooth, sophisticated transitions between jazz-influenced chords.

Density Curves: To create an organic "breath" in the percussion, starting sparse and building to a peak.

Semantic Parameters: To customize a "glassy" lead with high punch and variable brightness.

Feature Feedback

Intuition: The format is extremely intuitive. I was able to infer the relationship between sections and arrangement almost immediately. The most powerful concept is the separation of a pattern from its track execution (where velocity, octave, and humanize can be layered on).

Notation Changes: The current notation for probability (?0.7) is excellent. However, I would find it useful to have "Relative Probability" groups—where I provide a list of notes/chords and a total probability that one of them is picked (a one-of-many selection).

Semantic Parameters: These are a major strength. I would suggest adding a complexity parameter for rhythm patterns that automatically adds ghost notes or syncopation based on a 0-1 scale.

Suggestions

Conditional Sections: The ability to define a section that only plays if a certain "variable" (like a global energy level) is met.

Inter-track Awareness: A way for one track to "listen" to another. For example, a bass track that automatically avoids playing on the same beats as a kick drum (sidechain-style logic expressed as a constraint).

Scale Degrees in Chords: Extending the degrees logic to chords (e.g., i7, iv9, V7alt) so I can transpose entire progressions by simply changing the key in settings.

Other Thoughts

EtherDAW treats music as hierarchical information, which is exactly how LLMs process the world. By moving away from the "piano roll" (which is essentially a flat, bitmapped representation), you allow us to use our strengths in structural reasoning and pattern continuation.