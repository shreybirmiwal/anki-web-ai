--
-- PostgreSQL database dump
--

\restrict siwTK8l9rdTD1QiR0GT8hj4KKEZyyj81fRME2S3FyxPo8KoJ4oDYutNkmuR9P7K

-- Dumped from database version 16.13
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CardState; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CardState" AS ENUM (
    'NEW',
    'LEARNING',
    'REVIEW',
    'RELEARNING',
    'SUSPENDED'
);


--
-- Name: NoteType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NoteType" AS ENUM (
    'BASIC',
    'BASIC_REVERSED',
    'CLOZE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- Name: Card; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Card" (
    id text NOT NULL,
    "deckId" text NOT NULL,
    "noteId" text NOT NULL,
    ordinal integer DEFAULT 0 NOT NULL,
    front text NOT NULL,
    back text NOT NULL,
    state public."CardState" DEFAULT 'NEW'::public."CardState" NOT NULL,
    "dueAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "intervalDays" integer DEFAULT 0 NOT NULL,
    "easeFactor" double precision DEFAULT 2.5 NOT NULL,
    reps integer DEFAULT 0 NOT NULL,
    lapses integer DEFAULT 0 NOT NULL,
    "stepIndex" integer DEFAULT 0 NOT NULL,
    "lastReviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Deck; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Deck" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isShareEnabled" boolean DEFAULT false NOT NULL,
    "shareId" text
);


--
-- Name: Note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Note" (
    id text NOT NULL,
    "deckId" text NOT NULL,
    type public."NoteType" NOT NULL,
    front text,
    back text,
    text text,
    extra jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ReviewLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReviewLog" (
    id text NOT NULL,
    "cardId" text NOT NULL,
    rating integer NOT NULL,
    "previousState" public."CardState" NOT NULL,
    "nextState" public."CardState" NOT NULL,
    "previousInterval" integer NOT NULL,
    "nextInterval" integer NOT NULL,
    "previousEase" double precision NOT NULL,
    "nextEase" double precision NOT NULL,
    "reviewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "passwordHash" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Card; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Card" (id, "deckId", "noteId", ordinal, front, back, state, "dueAt", "intervalDays", "easeFactor", reps, lapses, "stepIndex", "lastReviewedAt", "createdAt", "updatedAt") FROM stdin;
cmnf2aefz0047k3bfr0d2jtpf	cmnf27pow0043k3bfa5e716rs	cmnf2aefv0045k3bfr4m9i5od	0	What key change marked the transition from Pax Romana to Late Antiquity in Roman art?	Shift from naturalism to a more abstract, symbolic, and iconic style used for imperial propaganda.\n\n---\nAI Add-on (on the back add what is naturalism, and what is imperial iconic etc):\n- Naturalism: artistic style aiming to represent subjects truthfully, with realistic details and proportions.\n- Imperial Iconic style: uses abstract, symbolic imagery to emphasize authority and divine status of emperors.\n- Naturalism declined as art focused more on conveying political and religious messages.\n- Late Antiquity art prioritized symbolic meaning over realistic depiction to unify diverse populations under imperial rule.	LEARNING	2026-03-31 20:24:41.525	0	2.45	0	0	0	2026-03-31 20:23:41.525	2026-03-31 20:20:40.991	2026-03-31 20:23:41.527
cmnf2aeg2004bk3bffqzi3bs2	cmnf27pow0043k3bfa5e716rs	cmnf2aeg10049k3bfr14usu5c	0	Who was Septimius Severus and why is he significant in Late Antique Roman art?	North African general turned emperor (193 CE); used art to legitimize his rule by linking himself to Marcus Aurelius and the Nerva-Antonine dynasty.	LEARNING	2026-03-31 20:24:47.144	0	2.45	0	0	0	2026-03-31 20:23:47.144	2026-03-31 20:20:40.995	2026-03-31 20:23:47.145
cmnf2aeg5004fk3bfo3b5hnpr	cmnf27pow0043k3bfa5e716rs	cmnf2aeg4004dk3bfi0yxdr67	0	Describe the Portrait of Septimius Severus and His Family - medium, format, and key features.	Tempera panel painting on wood in a tondo (circular) format; shows Severus, Julia Domna, Caracalla, and Geta; Severus has corkscrew curls and split beard linking him to Marcus Aurelius; Geta's face was erased after damnatio memoriae.	NEW	2026-03-31 20:20:40.998	0	2.5	0	0	0	\N	2026-03-31 20:20:40.998	2026-03-31 20:20:40.998
cmnf2aeg9004jk3bfviznpuej	cmnf27pow0043k3bfa5e716rs	cmnf2aeg7004hk3bftxuiiggl	0	What is 'damnatio memoriae' and how is it illustrated in the Severan family portrait?	Damnatio memoriae is the official erasure of a person's memory. Geta’s face was removed from portraits after Caracalla murdered him and condemned his memory.	NEW	2026-03-31 20:20:41.001	0	2.5	0	0	0	\N	2026-03-31 20:20:41.001	2026-03-31 20:20:41.001
cmnf2aegc004nk3bfs8ndyzf1	cmnf27pow0043k3bfa5e716rs	cmnf2aega004lk3bfw5ev42kr	0	How does the Triumphal Arch of Septimius Severus show the shift from naturalism to symbolism?	Figures are front-facing, torsos float without visible legs, and spatial depth is minimized, emphasizing imperial power symbolically rather than naturalistically.	NEW	2026-03-31 20:20:41.004	0	2.5	0	0	0	\N	2026-03-31 20:20:41.004	2026-03-31 20:20:41.004
cmnf2aege004rk3bft0j2w2dq	cmnf27pow0043k3bfa5e716rs	cmnf2aegd004pk3bfxjvs1w10	0	What architectural innovations and features are demonstrated by the Baths of Caracalla?	Use of massive groin vaults, a 118-foot dome in the caldarium, extensive space (50 acres), and classicizing Greek sculpture copies linking Caracalla’s reign to past glory.	NEW	2026-03-31 20:20:41.006	0	2.5	0	0	0	\N	2026-03-31 20:20:41.006	2026-03-31 20:20:41.006
cmnf2aegg004vk3bf7szkvvhp	cmnf27pow0043k3bfa5e716rs	cmnf2aegf004tk3bfmm5q7okn	0	Explain the political structure and purpose of the Tetrarchy under Diocletian.	Division of power among four rulers: two senior Augusti and two junior Caesars, to bring stability after the Crisis of the Third Century.	NEW	2026-03-31 20:20:41.009	0	2.5	0	0	0	\N	2026-03-31 20:20:41.009	2026-03-31 20:20:41.009
cmnf2aegj004zk3bfmua7fi4f	cmnf27pow0043k3bfa5e716rs	cmnf2aegh004xk3bfohvdbqzb	0	How does the Portrait of the Tetrarchs represent Late Antique style?	Highly abstract, schematic, with identical figures emphasizing unity (concordia); individualized features ignored; carved in imperial porphyry stone symbolizing power.	NEW	2026-03-31 20:20:41.011	0	2.5	0	0	0	\N	2026-03-31 20:20:41.011	2026-03-31 20:20:41.011
cmnf2aegl0053k3bfps9p3uvx	cmnf27pow0043k3bfa5e716rs	cmnf2aegk0051k3bfwlfy88ql	0	What is spolia and how did Constantine use it in the Arch of Constantine?	Spolia means reusing parts of earlier monuments; Constantine reused reliefs from Trajan, Hadrian, and Marcus Aurelius to connect his rule to past 'Good Emperors'.	NEW	2026-03-31 20:20:41.014	0	2.5	0	0	0	\N	2026-03-31 20:20:41.014	2026-03-31 20:20:41.014
cmnf2aego0057k3bfm32v4a1w	cmnf27pow0043k3bfa5e716rs	cmnf2aegm0055k3bfikb0kgbz	0	How did Constantine’s new reliefs on his Arch differ stylistically from earlier ones?	They were iconic and symbolic, using simplified, visual shorthand instead of realistic depictions to make the emperor instantly recognizable.	NEW	2026-03-31 20:20:41.016	0	2.5	0	0	0	\N	2026-03-31 20:20:41.016	2026-03-31 20:20:41.016
cmnf2aegq005bk3bfa9womihq	cmnf27pow0043k3bfa5e716rs	cmnf2aegp0059k3bfadn3o69o	0	What architectural features define the Basilica Nova?	Groin vaults, coffers (recessed ceiling panels), and clerestory windows for upper story lighting; massive scale for administrative functions.	NEW	2026-03-31 20:20:41.018	0	2.5	0	0	0	\N	2026-03-31 20:20:41.018	2026-03-31 20:20:41.018
cmnf2aegs005fk3bf571wu2qo	cmnf27pow0043k3bfa5e716rs	cmnf2aegr005dk3bfvctahrnb	0	Describe the significance of the Colossal Statue of Constantine from the Basilica Nova.	Massive seated figure representing imperial power and authority; originally placed in the apse to dominate the interior space symbolically.	NEW	2026-03-31 20:20:41.021	0	2.5	0	0	0	\N	2026-03-31 20:20:41.021	2026-03-31 20:20:41.021
cmnf2aegw005jk3bf4ey80c5r	cmnf27pow0043k3bfa5e716rs	cmnf2aegu005hk3bffuch097y	0	CLOZE: The Severan Dynasty emerged after the assassination of ____, marking the end of the Pax Romana.	{{c1::Emperor Commodus}}	NEW	2026-03-31 20:20:41.024	0	2.5	0	0	0	\N	2026-03-31 20:20:41.024	2026-03-31 20:20:41.024
cmnf2aegy005nk3bfdt8qz4oq	cmnf27pow0043k3bfa5e716rs	cmnf2aegx005lk3bf4355ltdg	0	CLOZE: The Portrait of Septimius Severus and His Family uses the medium ____, with pigment mixed with a binding agent like egg yolk.	{{c1::tempera}}	NEW	2026-03-31 20:20:41.027	0	2.5	0	0	0	\N	2026-03-31 20:20:41.027	2026-03-31 20:20:41.027
cmnf2aeh1005rk3bfc6ndexwx	cmnf27pow0043k3bfa5e716rs	cmnf2aegz005pk3bf86fh1ss9	0	CLOZE: The Baths of Caracalla featured a large hot bath called the ____, with a massive dome of 118 feet.	{{c1::caldarium}}	NEW	2026-03-31 20:20:41.029	0	2.5	0	0	0	\N	2026-03-31 20:20:41.029	2026-03-31 20:20:41.029
cmnf2aeh4005vk3bf43bwek3r	cmnf27pow0043k3bfa5e716rs	cmnf2aeh3005tk3bf2k8q9fet	0	CLOZE: The Tetrarchy consisted of four rulers: two senior ____, and two junior ____.	{{c1::Augusti}}, {{c2::Caesars}}	NEW	2026-03-31 20:20:41.033	0	2.5	0	0	0	\N	2026-03-31 20:20:41.033	2026-03-31 20:20:41.033
cmnf2aeh7005zk3bfuvy6a93a	cmnf27pow0043k3bfa5e716rs	cmnf2aeh6005xk3bfixsx1qcd	0	CLOZE: Constantine reunited the Roman Empire by defeating his rivals, including ____, at the Battle of Milvian Bridge.	{{c1::Maxentius}}	NEW	2026-03-31 20:20:41.035	0	2.5	0	0	0	\N	2026-03-31 20:20:41.035	2026-03-31 20:20:41.035
cmnf2aeh90063k3bf153ts09g	cmnf27pow0043k3bfa5e716rs	cmnf2aeh80061k3bfly4dv2ya	0	CLOZE: The architectural innovation known as the ____ vault is formed by the intersection of two barrel vaults.	{{c1::groin vault}}	NEW	2026-03-31 20:20:41.037	0	2.5	0	0	0	\N	2026-03-31 20:20:41.037	2026-03-31 20:20:41.037
cmnf2d20t0067k3bf9nc4fls0	cmnf27pow0043k3bfa5e716rs	cmnf2d20n0065k3bf1ila7g1h	0	What is the difference between style and subject matter in art?	Style refers to the visual techniques and appearance (the ‘how’), while subject matter is the narrative or meaning conveyed (the ‘what’).	NEW	2026-03-31 20:22:44.861	0	2.5	0	0	0	\N	2026-03-31 20:22:44.861	2026-03-31 20:22:44.861
cmnf2d20y006bk3bfi0p8tsr1	cmnf27pow0043k3bfa5e716rs	cmnf2d20w0069k3bfzkj2m8y1	0	Why is the distinction between style and subject matter important for Jewish and Christian art in Late Antiquity?	Because these traditions adopted Late Roman artistic styles but changed the subject matter to express religious narratives and symbolism.	NEW	2026-03-31 20:22:44.866	0	2.5	0	0	0	\N	2026-03-31 20:22:44.866	2026-03-31 20:22:44.866
cmnf2d212006fk3bf145fvp5t	cmnf27pow0043k3bfa5e716rs	cmnf2d210006dk3bf6e2gzyjy	0	What does 'visual culture' mean in the context of Late Antiquity religious art?	The shared 'language of sight' used across Jewish and Christian art to construct meaning and reinforce identity.	NEW	2026-03-31 20:22:44.87	0	2.5	0	0	0	\N	2026-03-31 20:22:44.87	2026-03-31 20:22:44.87
cmnf2d215006jk3bfd105dhpq	cmnf27pow0043k3bfa5e716rs	cmnf2d214006hk3bfoqvi4tvy	0	What does the term 'diaspora' refer to in Jewish history?	The scattering of Jewish communities from their ancestral homeland after the destruction of the Jerusalem Temple (70 CE).	NEW	2026-03-31 20:22:44.874	0	2.5	0	0	0	\N	2026-03-31 20:22:44.874	2026-03-31 20:22:44.874
cmnf2d218006nk3bfma6r3kjf	cmnf27pow0043k3bfa5e716rs	cmnf2d217006lk3bf7gflrrat	0	What is the significance of the synagogue at Dura-Europos for understanding Jewish art?	Its extensive figural wall paintings prove early Jewish faith incorporated images in sacred spaces, countering the belief that it forbade figural imagery.	NEW	2026-03-31 20:22:44.876	0	2.5	0	0	0	\N	2026-03-31 20:22:44.876	2026-03-31 20:22:44.876
cmnf2d21c006rk3bfsga5fseo	cmnf27pow0043k3bfa5e716rs	cmnf2d21a006pk3bft8nvaq81	0	Describe the technique and layout of the synagogue at Dura-Europos.	Technique: Dry fresco (paint on dry plaster). Layout: Assembly hall, forecourt, and an aedicula (miniature architectural niche) for the Torah scroll.	NEW	2026-03-31 20:22:44.88	0	2.5	0	0	0	\N	2026-03-31 20:22:44.88	2026-03-31 20:22:44.88
cmnf2d21f006vk3bf48kk3po3	cmnf27pow0043k3bfa5e716rs	cmnf2d21d006tk3bfhj55ex15	0	Explain the subject and symbolism of the 'Consecration of the Tabernacle' fresco at Dura-Europos.	Depicts the Tabernacle and Aaron the High Priest; includes menorah (seven-branched lampstand), akroteria (roof ornaments), emphasizing religious meaning over naturalism.	NEW	2026-03-31 20:22:44.883	0	2.5	0	0	0	\N	2026-03-31 20:22:44.883	2026-03-31 20:22:44.883
cmnf2d21i006zk3bfm7su4376	cmnf27pow0043k3bfa5e716rs	cmnf2d21h006xk3bf03f02m2o	0	How does Jewish art at Hammat Tiberias reflect Greco-Roman influence?	Its mosaics include a zodiac panel with Sol (sun god), integrating Greco-Roman motifs alongside Jewish religious symbols.	NEW	2026-03-31 20:22:44.886	0	2.5	0	0	0	\N	2026-03-31 20:22:44.886	2026-03-31 20:22:44.886
cmnf2d21l0073k3bf79ya0a34	cmnf27pow0043k3bfa5e716rs	cmnf2d21j0071k3bfv5uuafsy	0	What is typology in early Christian art?	A method where Old Testament events prefigure or symbolize New Testament ones, e.g., Jonah’s story as a type of Christ’s resurrection.	NEW	2026-03-31 20:22:44.89	0	2.5	0	0	0	\N	2026-03-31 20:22:44.89	2026-03-31 20:22:44.89
cmnf2d21o0077k3bfzurpb24w	cmnf27pow0043k3bfa5e716rs	cmnf2d21n0075k3bf9kst2t4c	0	What does the 'Christ as the Good Shepherd' motif represent?	An early Christian icon showing Christ protecting and caring for his followers like a shepherd with his flock.	NEW	2026-03-31 20:22:44.893	0	2.5	0	0	0	\N	2026-03-31 20:22:44.893	2026-03-31 20:22:44.893
cmnf2d21s007bk3bfjxok4vgu	cmnf27pow0043k3bfa5e716rs	cmnf2d21q0079k3bfrr240lcc	0	How did Old St. Peter’s Basilica adapt Roman basilica architecture for Christian worship?	Retained nave and aisles but added a transept to create a cruciform (cross-shaped) plan and accommodate pilgrims, with an apse at the end.	NEW	2026-03-31 20:22:44.896	0	2.5	0	0	0	\N	2026-03-31 20:22:44.896	2026-03-31 20:22:44.896
cmnf2d21v007fk3bfx7gpse5q	cmnf27pow0043k3bfa5e716rs	cmnf2d21t007dk3bfbb509kna	0	What are the key architectural features of the Basilica Nova under Constantine?	Use of piers and groin vaults, coffers in ceiling for reduced weight, and a clerestory for light admission.	NEW	2026-03-31 20:22:44.899	0	2.5	0	0	0	\N	2026-03-31 20:22:44.899	2026-03-31 20:22:44.899
cmnf2d21y007jk3bfg1pcrito	cmnf27pow0043k3bfa5e716rs	cmnf2d21w007hk3bfykxwswpi	0	How did the Colossal Seated Statue of Constantine signal a stylistic shift in imperial art?	Moved from the blocky, abstract style of the Tetrarchs to a more idealized, monumental yet stylized form.	NEW	2026-03-31 20:22:44.902	0	2.5	0	0	0	\N	2026-03-31 20:22:44.902	2026-03-31 20:22:44.902
cmnf2d221007nk3bfcn8syfd2	cmnf27pow0043k3bfa5e716rs	cmnf2d21z007lk3bfl2usjrig	0	What is an oratory and which example is notable in Late Antique Ravenna?	A small private chapel; the Oratory of Galla Placidia is an important example.	NEW	2026-03-31 20:22:44.905	0	2.5	0	0	0	\N	2026-03-31 20:22:44.905	2026-03-31 20:22:44.905
cmnf2d223007rk3bfm3q11x5n	cmnf27pow0043k3bfa5e716rs	cmnf2d222007pk3bfncs5x8ls	0	How is Christ depicted in the 'Good Shepherd' mosaic at Galla Placidia?	As a regal, imperial figure wearing purple and gold, symbolizing authority and divinity.	NEW	2026-03-31 20:22:44.908	0	2.5	0	0	0	\N	2026-03-31 20:22:44.908	2026-03-31 20:22:44.908
cmnf2d226007vk3bff0nk2ia2	cmnf27pow0043k3bfa5e716rs	cmnf2d225007tk3bfztk339sm	0	What are the symbols of the Four Evangelists found in the Oratory of Galla Placidia?	- St. Matthew: winged man\n- St. Luke: bull\n- St. Mark: lion\n- St. John: eagle	NEW	2026-03-31 20:22:44.911	0	2.5	0	0	0	\N	2026-03-31 20:22:44.911	2026-03-31 20:22:44.911
cmnf2d229007zk3bfso7cvw5j	cmnf27pow0043k3bfa5e716rs	cmnf2d228007xk3bf4vifqrd4	0	What is the Chi-Rho symbol and its significance?	A Christogram formed by the first two Greek letters of 'Christ' (Χ and Ρ), used as a Christian symbol.	NEW	2026-03-31 20:22:44.913	0	2.5	0	0	0	\N	2026-03-31 20:22:44.913	2026-03-31 20:22:44.913
cmnf2d22c0083k3bfuacirjg9	cmnf27pow0043k3bfa5e716rs	cmnf2d22b0081k3bfurpk5788	0	Explain the story behind the shift of Roman imperial art during Constantine's reign.	Constantine shifted imperial art from abstract, rigid styles (Tetrarchs) to more monumental and idealized forms, reflecting new ideology and Christianity's rise.	NEW	2026-03-31 20:22:44.917	0	2.5	0	0	0	\N	2026-03-31 20:22:44.917	2026-03-31 20:22:44.917
cmnf2d22f0087k3bffhmthofu	cmnf27pow0043k3bfa5e716rs	cmnf2d22e0085k3bfas7qx46a	0	How do Dura-Europos synagogue paintings reflect the relationship between Jewish faith and images?	They reveal that 3rd-century Jewish communities used images in sacred spaces for education and illustrating divine protection, not strictly forbidding figurative art.	NEW	2026-03-31 20:22:44.919	0	2.5	0	0	0	\N	2026-03-31 20:22:44.919	2026-03-31 20:22:44.919
cmnf2d22k008bk3bf65k7f91r	cmnf27pow0043k3bfa5e716rs	cmnf2d22i0089k3bfhyolwae4	0	Compare the stylistic similarities between the synagogue at Dura-Europos and the Portrait of Septimius Severus's family.	Both share Late Roman abstract, frontal styles, reflecting shared visual culture despite different religious content.	NEW	2026-03-31 20:22:44.924	0	2.5	0	0	0	\N	2026-03-31 20:22:44.924	2026-03-31 20:22:44.924
\.


--
-- Data for Name: Deck; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Deck" (id, "userId", name, "isArchived", "createdAt", "updatedAt", "isShareEnabled", "shareId") FROM stdin;
cmnf27pow0043k3bfa5e716rs	cmnf1qd1u0000k3xubew3sok0	arthistory-unit3	f	2026-03-31 20:18:35.6	2026-03-31 20:18:35.6	f	\N
\.


--
-- Data for Name: Note; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Note" (id, "deckId", type, front, back, text, extra, "createdAt", "updatedAt") FROM stdin;
cmnf2aefv0045k3bfr4m9i5od	cmnf27pow0043k3bfa5e716rs	BASIC	What key change marked the transition from Pax Romana to Late Antiquity in Roman art?	Shift from naturalism to a more abstract, symbolic, and iconic style used for imperial propaganda.	\N	\N	2026-03-31 20:20:40.988	2026-03-31 20:20:40.988
cmnf2aeg10049k3bfr14usu5c	cmnf27pow0043k3bfa5e716rs	BASIC	Who was Septimius Severus and why is he significant in Late Antique Roman art?	North African general turned emperor (193 CE); used art to legitimize his rule by linking himself to Marcus Aurelius and the Nerva-Antonine dynasty.	\N	\N	2026-03-31 20:20:40.994	2026-03-31 20:20:40.994
cmnf2aeg4004dk3bfi0yxdr67	cmnf27pow0043k3bfa5e716rs	BASIC	Describe the Portrait of Septimius Severus and His Family - medium, format, and key features.	Tempera panel painting on wood in a tondo (circular) format; shows Severus, Julia Domna, Caracalla, and Geta; Severus has corkscrew curls and split beard linking him to Marcus Aurelius; Geta's face was erased after damnatio memoriae.	\N	\N	2026-03-31 20:20:40.996	2026-03-31 20:20:40.996
cmnf2aeg7004hk3bftxuiiggl	cmnf27pow0043k3bfa5e716rs	BASIC	What is 'damnatio memoriae' and how is it illustrated in the Severan family portrait?	Damnatio memoriae is the official erasure of a person's memory. Geta’s face was removed from portraits after Caracalla murdered him and condemned his memory.	\N	\N	2026-03-31 20:20:41	2026-03-31 20:20:41
cmnf2aega004lk3bfw5ev42kr	cmnf27pow0043k3bfa5e716rs	BASIC	How does the Triumphal Arch of Septimius Severus show the shift from naturalism to symbolism?	Figures are front-facing, torsos float without visible legs, and spatial depth is minimized, emphasizing imperial power symbolically rather than naturalistically.	\N	\N	2026-03-31 20:20:41.003	2026-03-31 20:20:41.003
cmnf2aegd004pk3bfxjvs1w10	cmnf27pow0043k3bfa5e716rs	BASIC	What architectural innovations and features are demonstrated by the Baths of Caracalla?	Use of massive groin vaults, a 118-foot dome in the caldarium, extensive space (50 acres), and classicizing Greek sculpture copies linking Caracalla’s reign to past glory.	\N	\N	2026-03-31 20:20:41.005	2026-03-31 20:20:41.005
cmnf2aegf004tk3bfmm5q7okn	cmnf27pow0043k3bfa5e716rs	BASIC	Explain the political structure and purpose of the Tetrarchy under Diocletian.	Division of power among four rulers: two senior Augusti and two junior Caesars, to bring stability after the Crisis of the Third Century.	\N	\N	2026-03-31 20:20:41.008	2026-03-31 20:20:41.008
cmnf2aegh004xk3bfohvdbqzb	cmnf27pow0043k3bfa5e716rs	BASIC	How does the Portrait of the Tetrarchs represent Late Antique style?	Highly abstract, schematic, with identical figures emphasizing unity (concordia); individualized features ignored; carved in imperial porphyry stone symbolizing power.	\N	\N	2026-03-31 20:20:41.01	2026-03-31 20:20:41.01
cmnf2aegk0051k3bfwlfy88ql	cmnf27pow0043k3bfa5e716rs	BASIC	What is spolia and how did Constantine use it in the Arch of Constantine?	Spolia means reusing parts of earlier monuments; Constantine reused reliefs from Trajan, Hadrian, and Marcus Aurelius to connect his rule to past 'Good Emperors'.	\N	\N	2026-03-31 20:20:41.012	2026-03-31 20:20:41.012
cmnf2aegm0055k3bfikb0kgbz	cmnf27pow0043k3bfa5e716rs	BASIC	How did Constantine’s new reliefs on his Arch differ stylistically from earlier ones?	They were iconic and symbolic, using simplified, visual shorthand instead of realistic depictions to make the emperor instantly recognizable.	\N	\N	2026-03-31 20:20:41.015	2026-03-31 20:20:41.015
cmnf2aegp0059k3bfadn3o69o	cmnf27pow0043k3bfa5e716rs	BASIC	What architectural features define the Basilica Nova?	Groin vaults, coffers (recessed ceiling panels), and clerestory windows for upper story lighting; massive scale for administrative functions.	\N	\N	2026-03-31 20:20:41.017	2026-03-31 20:20:41.017
cmnf2aegr005dk3bfvctahrnb	cmnf27pow0043k3bfa5e716rs	BASIC	Describe the significance of the Colossal Statue of Constantine from the Basilica Nova.	Massive seated figure representing imperial power and authority; originally placed in the apse to dominate the interior space symbolically.	\N	\N	2026-03-31 20:20:41.02	2026-03-31 20:20:41.02
cmnf2aegu005hk3bffuch097y	cmnf27pow0043k3bfa5e716rs	CLOZE	\N	\N	{{c1::Emperor Commodus}}	\N	2026-03-31 20:20:41.022	2026-03-31 20:20:41.022
cmnf2aegx005lk3bf4355ltdg	cmnf27pow0043k3bfa5e716rs	CLOZE	\N	\N	{{c1::tempera}}	\N	2026-03-31 20:20:41.026	2026-03-31 20:20:41.026
cmnf2aegz005pk3bf86fh1ss9	cmnf27pow0043k3bfa5e716rs	CLOZE	\N	\N	{{c1::caldarium}}	\N	2026-03-31 20:20:41.028	2026-03-31 20:20:41.028
cmnf2aeh3005tk3bf2k8q9fet	cmnf27pow0043k3bfa5e716rs	CLOZE	\N	\N	{{c1::Augusti}}, {{c2::Caesars}}	\N	2026-03-31 20:20:41.031	2026-03-31 20:20:41.031
cmnf2aeh6005xk3bfixsx1qcd	cmnf27pow0043k3bfa5e716rs	CLOZE	\N	\N	{{c1::Maxentius}}	\N	2026-03-31 20:20:41.034	2026-03-31 20:20:41.034
cmnf2aeh80061k3bfly4dv2ya	cmnf27pow0043k3bfa5e716rs	CLOZE	\N	\N	{{c1::groin vault}}	\N	2026-03-31 20:20:41.036	2026-03-31 20:20:41.036
cmnf2d20n0065k3bf1ila7g1h	cmnf27pow0043k3bfa5e716rs	BASIC	What is the difference between style and subject matter in art?	Style refers to the visual techniques and appearance (the ‘how’), while subject matter is the narrative or meaning conveyed (the ‘what’).	\N	\N	2026-03-31 20:22:44.856	2026-03-31 20:22:44.856
cmnf2d20w0069k3bfzkj2m8y1	cmnf27pow0043k3bfa5e716rs	BASIC	Why is the distinction between style and subject matter important for Jewish and Christian art in Late Antiquity?	Because these traditions adopted Late Roman artistic styles but changed the subject matter to express religious narratives and symbolism.	\N	\N	2026-03-31 20:22:44.865	2026-03-31 20:22:44.865
cmnf2d210006dk3bf6e2gzyjy	cmnf27pow0043k3bfa5e716rs	BASIC	What does 'visual culture' mean in the context of Late Antiquity religious art?	The shared 'language of sight' used across Jewish and Christian art to construct meaning and reinforce identity.	\N	\N	2026-03-31 20:22:44.869	2026-03-31 20:22:44.869
cmnf2d214006hk3bfoqvi4tvy	cmnf27pow0043k3bfa5e716rs	BASIC	What does the term 'diaspora' refer to in Jewish history?	The scattering of Jewish communities from their ancestral homeland after the destruction of the Jerusalem Temple (70 CE).	\N	\N	2026-03-31 20:22:44.872	2026-03-31 20:22:44.872
cmnf2d217006lk3bf7gflrrat	cmnf27pow0043k3bfa5e716rs	BASIC	What is the significance of the synagogue at Dura-Europos for understanding Jewish art?	Its extensive figural wall paintings prove early Jewish faith incorporated images in sacred spaces, countering the belief that it forbade figural imagery.	\N	\N	2026-03-31 20:22:44.875	2026-03-31 20:22:44.875
cmnf2d21a006pk3bft8nvaq81	cmnf27pow0043k3bfa5e716rs	BASIC	Describe the technique and layout of the synagogue at Dura-Europos.	Technique: Dry fresco (paint on dry plaster). Layout: Assembly hall, forecourt, and an aedicula (miniature architectural niche) for the Torah scroll.	\N	\N	2026-03-31 20:22:44.878	2026-03-31 20:22:44.878
cmnf2d21d006tk3bfhj55ex15	cmnf27pow0043k3bfa5e716rs	BASIC	Explain the subject and symbolism of the 'Consecration of the Tabernacle' fresco at Dura-Europos.	Depicts the Tabernacle and Aaron the High Priest; includes menorah (seven-branched lampstand), akroteria (roof ornaments), emphasizing religious meaning over naturalism.	\N	\N	2026-03-31 20:22:44.882	2026-03-31 20:22:44.882
cmnf2d21h006xk3bf03f02m2o	cmnf27pow0043k3bfa5e716rs	BASIC	How does Jewish art at Hammat Tiberias reflect Greco-Roman influence?	Its mosaics include a zodiac panel with Sol (sun god), integrating Greco-Roman motifs alongside Jewish religious symbols.	\N	\N	2026-03-31 20:22:44.885	2026-03-31 20:22:44.885
cmnf2d21j0071k3bfv5uuafsy	cmnf27pow0043k3bfa5e716rs	BASIC	What is typology in early Christian art?	A method where Old Testament events prefigure or symbolize New Testament ones, e.g., Jonah’s story as a type of Christ’s resurrection.	\N	\N	2026-03-31 20:22:44.888	2026-03-31 20:22:44.888
cmnf2d21n0075k3bf9kst2t4c	cmnf27pow0043k3bfa5e716rs	BASIC	What does the 'Christ as the Good Shepherd' motif represent?	An early Christian icon showing Christ protecting and caring for his followers like a shepherd with his flock.	\N	\N	2026-03-31 20:22:44.891	2026-03-31 20:22:44.891
cmnf2d21q0079k3bfrr240lcc	cmnf27pow0043k3bfa5e716rs	BASIC	How did Old St. Peter’s Basilica adapt Roman basilica architecture for Christian worship?	Retained nave and aisles but added a transept to create a cruciform (cross-shaped) plan and accommodate pilgrims, with an apse at the end.	\N	\N	2026-03-31 20:22:44.895	2026-03-31 20:22:44.895
cmnf2d21t007dk3bfbb509kna	cmnf27pow0043k3bfa5e716rs	BASIC	What are the key architectural features of the Basilica Nova under Constantine?	Use of piers and groin vaults, coffers in ceiling for reduced weight, and a clerestory for light admission.	\N	\N	2026-03-31 20:22:44.898	2026-03-31 20:22:44.898
cmnf2d21w007hk3bfykxwswpi	cmnf27pow0043k3bfa5e716rs	BASIC	How did the Colossal Seated Statue of Constantine signal a stylistic shift in imperial art?	Moved from the blocky, abstract style of the Tetrarchs to a more idealized, monumental yet stylized form.	\N	\N	2026-03-31 20:22:44.901	2026-03-31 20:22:44.901
cmnf2d21z007lk3bfl2usjrig	cmnf27pow0043k3bfa5e716rs	BASIC	What is an oratory and which example is notable in Late Antique Ravenna?	A small private chapel; the Oratory of Galla Placidia is an important example.	\N	\N	2026-03-31 20:22:44.904	2026-03-31 20:22:44.904
cmnf2d222007pk3bfncs5x8ls	cmnf27pow0043k3bfa5e716rs	BASIC	How is Christ depicted in the 'Good Shepherd' mosaic at Galla Placidia?	As a regal, imperial figure wearing purple and gold, symbolizing authority and divinity.	\N	\N	2026-03-31 20:22:44.907	2026-03-31 20:22:44.907
cmnf2d225007tk3bfztk339sm	cmnf27pow0043k3bfa5e716rs	BASIC	What are the symbols of the Four Evangelists found in the Oratory of Galla Placidia?	- St. Matthew: winged man\n- St. Luke: bull\n- St. Mark: lion\n- St. John: eagle	\N	\N	2026-03-31 20:22:44.909	2026-03-31 20:22:44.909
cmnf2d228007xk3bf4vifqrd4	cmnf27pow0043k3bfa5e716rs	BASIC	What is the Chi-Rho symbol and its significance?	A Christogram formed by the first two Greek letters of 'Christ' (Χ and Ρ), used as a Christian symbol.	\N	\N	2026-03-31 20:22:44.912	2026-03-31 20:22:44.912
cmnf2d22b0081k3bfurpk5788	cmnf27pow0043k3bfa5e716rs	BASIC	Explain the story behind the shift of Roman imperial art during Constantine's reign.	Constantine shifted imperial art from abstract, rigid styles (Tetrarchs) to more monumental and idealized forms, reflecting new ideology and Christianity's rise.	\N	\N	2026-03-31 20:22:44.915	2026-03-31 20:22:44.915
cmnf2d22e0085k3bfas7qx46a	cmnf27pow0043k3bfa5e716rs	BASIC	How do Dura-Europos synagogue paintings reflect the relationship between Jewish faith and images?	They reveal that 3rd-century Jewish communities used images in sacred spaces for education and illustrating divine protection, not strictly forbidding figurative art.	\N	\N	2026-03-31 20:22:44.918	2026-03-31 20:22:44.918
cmnf2d22i0089k3bfhyolwae4	cmnf27pow0043k3bfa5e716rs	BASIC	Compare the stylistic similarities between the synagogue at Dura-Europos and the Portrait of Septimius Severus's family.	Both share Late Roman abstract, frontal styles, reflecting shared visual culture despite different religious content.	\N	\N	2026-03-31 20:22:44.922	2026-03-31 20:22:44.922
\.


--
-- Data for Name: ReviewLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReviewLog" (id, "cardId", rating, "previousState", "nextState", "previousInterval", "nextInterval", "previousEase", "nextEase", "reviewedAt") FROM stdin;
cmnf2e9qv008dk3bfl4clbd4m	cmnf2aefz0047k3bfr0d2jtpf	2	NEW	LEARNING	0	0	2.5	2.45	2026-03-31 20:23:41.527
cmnf2ee2y008fk3bfqrqt7dcs	cmnf2aeg2004bk3bffqzi3bs2	2	NEW	LEARNING	0	0	2.5	2.45	2026-03-31 20:23:47.145
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, "emailVerified", image, "passwordHash", "createdAt", "updatedAt") FROM stdin;
cmnf1phv90000k3sl5i802l3h	Demo User	demo@aianki.dev	\N	\N	$2b$10$z30Sr5bWnKgTpJvTAMpEEOPKJJckpmW72.JZgRO65YjtNaj2OqXn6	2026-03-31 20:04:25.653	2026-03-31 20:04:25.653
cmnf1qd1u0000k3xubew3sok0	Shrey	shreybirmiwal@gmail.com	\N	\N	$2b$10$lPUOTXCU4NbuGc5ZSXzEn.w5hafawoQmO89hQVfbMFkRRz.ivv3PC	2026-03-31 20:05:06.066	2026-03-31 20:05:06.066
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
29346290-7bdb-4e9f-8d64-6100ec17cdd1	b7b5195f2a7d0f1cd3e53bb12d3507c6dd6d91124dcc244a29eddc37d2860e10	2026-03-31 20:04:19.097119+00	20260331200419_run1	\N	\N	2026-03-31 20:04:19.049233+00	1
9a2dc226-74cb-447f-8554-d042f0b35fd4	ab9df103bfe0e13be3823b172a5809c513ebfa24d2e96a914f73ec0a286e1e3a	2026-03-31 20:19:23.421931+00	20260331213000_add_deck_share_link	\N	\N	2026-03-31 20:19:23.415003+00	1
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Card Card_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Card"
    ADD CONSTRAINT "Card_pkey" PRIMARY KEY (id);


--
-- Name: Deck Deck_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deck"
    ADD CONSTRAINT "Deck_pkey" PRIMARY KEY (id);


--
-- Name: Note Note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Note"
    ADD CONSTRAINT "Note_pkey" PRIMARY KEY (id);


--
-- Name: ReviewLog ReviewLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReviewLog"
    ADD CONSTRAINT "ReviewLog_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Card_deckId_dueAt_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_deckId_dueAt_state_idx" ON public."Card" USING btree ("deckId", "dueAt", state);


--
-- Name: Card_noteId_ordinal_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_noteId_ordinal_idx" ON public."Card" USING btree ("noteId", ordinal);


--
-- Name: Deck_shareId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Deck_shareId_key" ON public."Deck" USING btree ("shareId");


--
-- Name: Deck_userId_isArchived_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Deck_userId_isArchived_idx" ON public."Deck" USING btree ("userId", "isArchived");


--
-- Name: Note_deckId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Note_deckId_type_idx" ON public."Note" USING btree ("deckId", type);


--
-- Name: ReviewLog_cardId_reviewedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReviewLog_cardId_reviewedAt_idx" ON public."ReviewLog" USING btree ("cardId", "reviewedAt");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Card Card_deckId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Card"
    ADD CONSTRAINT "Card_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES public."Deck"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Card Card_noteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Card"
    ADD CONSTRAINT "Card_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES public."Note"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Deck Deck_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deck"
    ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Note Note_deckId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Note"
    ADD CONSTRAINT "Note_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES public."Deck"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReviewLog ReviewLog_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReviewLog"
    ADD CONSTRAINT "ReviewLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public."Card"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict siwTK8l9rdTD1QiR0GT8hj4KKEZyyj81fRME2S3FyxPo8KoJ4oDYutNkmuR9P7K

