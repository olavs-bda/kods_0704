// convex/seed.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if data already exists
    const existingOrg = await ctx.db
      .query("organisations")
      .withIndex("by_code", (q) => q.eq("code", "BDA-2026"))
      .first();
    if (existingOrg) {
      console.log("Seed data already exists, skipping.");
      return null;
    }

    // Create individual tasks
    const task1_1 = await ctx.db.insert("tasks", {
      slug: "task-1-1",
      title_lv: "Vienkārša teksta apkopošana",
      instruction_lv:
        "Uzrakstiet uzvedni, kas lūdz mākslīgo intelektu apkopot šo tekstu 3 teikumos. Uzvedne ir jāraksta latviešu valodā.",
      context_lv:
        "Mākslīgais intelekts saņems garu tekstu par digitālo transformāciju valsts pārvaldē. Jūsu uzdevums ir uzrakstīt skaidru un konkrētu uzvedni, kas nodrošina kvalitatīvu apkopojumu.",
      expectedOutput:
        "Concise 3-sentence summary of a text about digital transformation in public administration",
      level: 1,
      hints_lv:
        "Norādiet konkrētu teikumu skaitu un mērķauditoriju. Piemēram: 'Apkopo šo tekstu X teikumos...'",
      example_lv:
        "Apkopo šo tekstu 3 īsos teikumos, saglabājot galvenās atziņas par digitālo transformāciju.",
    });

    const task1_2 = await ctx.db.insert("tasks", {
      slug: "task-1-2",
      title_lv: "E-pasta uzmetums",
      instruction_lv:
        "Uzrakstiet uzvedni, kas lūdz AI sagatavot oficiālu e-pasta vēstuli kolēģim par sanāksmes pārcelšanu. Uzvedne ir jāraksta latviešu valodā.",
      context_lv:
        "Jums ir jāinformē kolēģis, ka piektdienas sanāksme tiek pārcelta uz nākamo otrdienu plkst. 10:00. Tonis ir jābūt profesionālam, bet draudzīgam.",
      expectedOutput:
        "Professional but friendly email in Latvian about rescheduling a meeting from Friday to next Tuesday at 10:00",
      level: 1,
      hints_lv:
        "Norādiet e-pasta toni, galveno informāciju (datums, laiks) un saņēmēju.",
    });

    const task2_1 = await ctx.db.insert("tasks", {
      slug: "task-2-1",
      title_lv: "Strukturēta datu izvilkšana",
      instruction_lv:
        "Uzrakstiet uzvedni, kas lūdz AI no nestrukturēta teksta izvilkt informāciju un sakārtot to tabulā ar kolonnām: Nosaukums, Datums, Summa. Uzvedne ir jāraksta latviešu valodā.",
      context_lv:
        "Jūs strādājat ar pārskatu, kurā ir pieminēti vairāki projekti, to termiņi un budžeti. Informācija ir izkaisīta pa tekstu, un jums tā jāsakārto strukturētā formātā.",
      expectedOutput:
        "Structured table extraction with columns: Name, Date, Amount from unstructured project report text",
      level: 2,
      hints_lv:
        "Norādiet precīzu izvades formātu (tabula, kolonnu nosaukumi) un datu avotu.",
    });

    const task2_2 = await ctx.db.insert("tasks", {
      slug: "task-2-2",
      title_lv: "Dokumenta analīze ar kontekstu",
      instruction_lv:
        "Uzrakstiet uzvedni, kas lūdz AI analizēt politikas dokumentu un identificēt 3 galvenos riskus, katru paskaidrojot 2 teikumos. Norādiet, ka analīzei jābūt no valsts pārvaldes perspektīvas. Uzvedne ir jāraksta latviešu valodā.",
      context_lv:
        "Jums ir politikas dokuments par datu aizsardzību publiskajā sektorā. Jūs vēlaties ātru riska analīzi, ko var prezentēt vadībai.",
      expectedOutput:
        "Risk analysis: 3 key risks from a data protection policy document, each explained in 2 sentences, from public administration perspective",
      level: 2,
      hints_lv:
        "Definējiet lomu (perspektīvu), precīzu formātu (3 riski × 2 teikumi) un kontekstu.",
    });

    const task3_1 = await ctx.db.insert("tasks", {
      slug: "task-3-1",
      title_lv: "Daudzsoļu uzdevums ar lomu",
      instruction_lv:
        "Uzrakstiet uzvedni, kas lūdz AI uzņemties jurista lomu un: 1) izanalizēt situāciju, 2) uzskaitīt piemērojamos normatīvos aktus, 3) sniegt ieteikumus. Izvadei jābūt strukturētai ar numurētiem soļiem. Uzvedne ir jāraksta latviešu valodā.",
      context_lv:
        "Iestāde plāno ieviest jaunu darbinieku monitoringa sistēmu. Nepieciešams juridisks vērtējums par tās atbilstību datu aizsardzības prasībām.",
      expectedOutput:
        "Multi-step legal analysis: 1) situation analysis, 2) applicable regulations, 3) recommendations — structured with numbered steps, from lawyer's perspective",
      level: 3,
      hints_lv:
        "Izmantojiet lomu piešķiršanu ('Tu esi...'), skaidru soļu secību un precīzu izvades formātu.",
    });

    const task3_2 = await ctx.db.insert("tasks", {
      slug: "task-3-2",
      title_lv: "Salīdzinošā analīze ar kritērijiem",
      instruction_lv:
        "Uzrakstiet uzvedni, kas lūdz AI salīdzināt divus risinājumus pēc 4 kritērijiem (izmaksas, ieviešanas laiks, drošība, lietotāju ērtība) un sniegt gala ieteikumu ar pamatojumu. Izvadei jābūt tabulas formātā ar secinājumu beigās. Uzvedne ir jāraksta latviešu valodā.",
      context_lv:
        "Iestāde izvēlas starp mākoņrisinājumu un lokālo serveri dokumentu pārvaldībai. Lēmums jāprezentē vadībai ar skaidru salīdzinājumu.",
      expectedOutput:
        "Comparative analysis table of 2 solutions across 4 criteria (cost, implementation time, security, usability) with justified recommendation",
      level: 3,
      hints_lv:
        "Norādiet abus salīdzināmos risinājumus, konkrētus kritērijus un vēlamo izvades formātu (tabula + secinājums).",
    });

    const allTaskIds = [task1_1, task1_2, task2_1, task2_2, task3_1, task3_2];

    // Create BDA-2026 organisation (all 6 tasks)
    await ctx.db.insert("organisations", {
      code: "BDA-2026",
      name: "BDA Darbnīca 2026",
      taskIds: allTaskIds,
      settings: {
        sessionExpiryHours: 48,
        maxSubmissionsPerUser: 50,
      },
    });

    // Create Saeima100426 organisation (shares same tasks)
    await ctx.db.insert("organisations", {
      code: "SAEIMA100426",
      name: "Saeima Darbnīca",
      taskIds: allTaskIds,
      settings: {
        sessionExpiryHours: 48,
        maxSubmissionsPerUser: 50,
      },
    });

    console.log("Seed data created: 2 organisations, 6 tasks.");
    return null;
  },
});
