import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent } from "./components/ui/card";
import * as XLSX from "xlsx";

export default function BadmintonPairingApp() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [hand, setHand] = useState("ขวา");
  const [skill, setSkill] = useState(3);
  const [teams, setTeams] = useState([]);
  const [groupedTeams, setGroupedTeams] = useState({ heavy: [], medium: [], light: [] });
  const [schedule, setSchedule] = useState([]);
  const [numCourts, setNumCourts] = useState(3);
  const [hoursPlayed, setHoursPlayed] = useState(2);
  const [courtRate, setCourtRate] = useState(200);
  const [shuttleCount, setShuttleCount] = useState(20);
  const [shuttlePrice, setShuttlePrice] = useState(15);

  const addPlayer = () => {
    if (name.trim() === "") return;
    setPlayers([...players, { name, hand, skill: parseInt(skill) }]);
    setName("");
    setHand("ขวา");
    setSkill(3);
  };

  const removePlayer = (index) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const importedPlayers = json.slice(1).map((row) => ({
        name: row[0],
        hand: row[1],
        skill: parseInt(row[2]),
      })).filter(p => p.name && (p.hand === "ขวา" || p.hand === "ซ้าย") && !isNaN(p.skill));
      setPlayers([...players, ...importedPlayers]);
    };
    reader.readAsArrayBuffer(file);
  };

  const shuffleAndPair = () => {
    let shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const newTeams = [];
    while (shuffled.length >= 4) {
      const p1 = shuffled.pop();
      const p2 = shuffled.pop();
      const p3 = shuffled.pop();
      const p4 = shuffled.pop();
      const team1Skill = p1.skill + p2.skill;
      const team2Skill = p3.skill + p4.skill;
      newTeams.push({
        team1: [p1, p2],
        team2: [p3, p4],
        team1Skill,
        team2Skill,
        hands: `${p1.hand}+${p2.hand} vs ${p3.hand}+${p4.hand}`,
      });
    }

    setTeams(newTeams);
    groupTeams(newTeams);
  };

  const groupTeams = (teams) => {
    const grouped = { heavy: [], medium: [], light: [] };
    for (const match of teams) {
      const { team1, team2, team1Skill, team2Skill, hands } = match;

      const team1Group = team1Skill >= 9 ? 'heavy' : team1Skill >= 7 ? 'medium' : 'light';
      const team2Group = team2Skill >= 9 ? 'heavy' : team2Skill >= 7 ? 'medium' : 'light';

      grouped[team1Group].push({ team1, team2: null, team1Skill, team2Skill: null, hands });
      grouped[team2Group].push({ team1: team2, team2: null, team1Skill: team2Skill, team2Skill: null, hands });
    }
    setGroupedTeams(grouped);
  };

  const generateSchedule = () => {
    const allMatches = [
      ...groupedTeams.heavy.map(t => ({ ...t, group: "มือหนัก" })),
      ...groupedTeams.medium.map(t => ({ ...t, group: "มือกลาง" })),
      ...groupedTeams.light.map(t => ({ ...t, group: "มือเบา" })),
    ];

    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0);

    const scheduleList = [];
    for (let i = 0; i < allMatches.length; i += 2) {
      const match1 = allMatches[i];
      const match2 = allMatches[i + 1];
      const court = (i / 2 % numCourts) + 1;
      scheduleList.push({
        matchNumber: (i / 2) + 1,
        group: `${match1?.group || ""}/${match2?.group || ""}`,
        team1: match1?.team1?.map(p => p.name).join(" + ") || "",
        team2: match2?.team1?.map(p => p.name).join(" + ") || "",
        court,
        start: '-',
        end: '-'
      });
    }
    setSchedule(scheduleList);
  };

  const totalCourtCost = hoursPlayed * courtRate;
  const totalShuttleCost = shuttleCount * shuttlePrice;
  const totalCost = totalCourtCost + totalShuttleCost;
  const costPerPerson = players.length > 0 ? (totalCost / players.length).toFixed(2) : 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">โปรแกรมจับคู่ตีแบด (แบบเล่นคู่)</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Input placeholder="ชื่อผู้เล่น" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={hand} onChange={(e) => setHand(e.target.value)} className="border p-2 rounded">
          <option value="ขวา">ขวา</option>
          <option value="ซ้าย">ซ้าย</option>
        </select>
        <select value={skill} onChange={(e) => setSkill(e.target.value)} className="border p-2 rounded">
          {[1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        <Button onClick={addPlayer}>เพิ่ม</Button>
        <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="p-2 text-sm border rounded" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
        {players.map((p, index) => (
          <Card key={index}>
            <CardContent className="p-2 text-sm">
              {p.name} - มือ {p.hand} - ระดับ {p.skill}
              <button onClick={() => removePlayer(index)} className="text-red-500 text-xs ml-2">ลบ</button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={shuffleAndPair} className="mb-4">สุ่มจับคู่</Button>

      {players.length % 4 !== 0 && <div className="text-red-500 mb-2">จำนวนผู้เล่นไม่ครบชุดละ 4 คน กรุณาเพิ่มให้ครบ</div>}

      {["heavy", "medium", "light"].map((key) => (
        <div key={key} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            กลุ่ม{key === 'heavy' ? 'มือหนัก (ทีม >=9)' : key === 'medium' ? 'มือกลาง (ทีม 7-8)' : 'มือเบา (<7)'}
          </h2>
          {groupedTeams[key].map((m, index) => (
            <Card key={index}>
              <CardContent className="p-2">
                <div>ทีม: {m.team1.map(p => p.name).join(" + ")} (คะแนน: {m.team1Skill})</div>
                <div className="text-sm text-gray-600">มือ: {m.hands}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}


      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">ตั้งค่าการลงสนาม</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <label>จำนวนสนาม:
            <input type="number" value={numCourts} onChange={(e) => setNumCourts(Number(e.target.value))} className="border rounded p-2 w-16 ml-2" />
          </label>
          <label>จำนวนชั่วโมง:
            <input type="number" value={hoursPlayed} onChange={(e) => setHoursPlayed(Number(e.target.value))} className="border rounded p-2 w-16 ml-2" />
          </label>
          <label>ค่าสนามต่อชั่วโมง:
            <input type="number" value={courtRate} onChange={(e) => setCourtRate(Number(e.target.value))} className="border rounded p-2 w-20 ml-2" />
          </label>
          <label>จำนวนลูก:
            <input type="number" value={shuttleCount} onChange={(e) => setShuttleCount(Number(e.target.value))} className="border rounded p-2 w-16 ml-2" />
          </label>
          <label>ราคาต่อลูก:
            <input type="number" value={shuttlePrice} onChange={(e) => setShuttlePrice(Number(e.target.value))} className="border rounded p-2 w-20 ml-2" />
          </label>
          <Button onClick={generateSchedule}>สร้างคิวลงสนาม</Button>
        </div>
        <div className="mt-2 text-sm">
          ค่าใช้จ่ายรวม: {totalCost} บาท | เฉลี่ยต่อคน: {costPerPerson} บาท
        </div>
      </div>

      {schedule.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">ตารางคิวลงสนาม</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">กลุ่ม</th>
                  <th className="border px-2 py-1">ทีม 1</th>
                  <th className="border px-2 py-1">ทีม 2</th>
                  <th className="border px-2 py-1">สนาม</th>
                  <th className="border px-2 py-1">เริ่ม</th>
                  <th className="border px-2 py-1">จบ</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{s.matchNumber}</td>
                    <td className="border px-2 py-1">{s.group}</td>
                    <td className="border px-2 py-1">{s.team1}</td>
                    <td className="border px-2 py-1">{s.team2}</td>
                    <td className="border px-2 py-1">สนาม {s.court}</td>
                    <td className="border px-2 py-1">{s.start}</td>
                    <td className="border px-2 py-1">{s.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}