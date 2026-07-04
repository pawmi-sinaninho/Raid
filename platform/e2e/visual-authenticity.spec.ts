import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

interface Identity {
  participant: { id: string; role: string };
  recoveryToken: string;
  sessionId: string;
}

async function apiPost(api: APIRequestContext, url: string, options: Parameters<APIRequestContext["post"]>[1]) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await api.post(url, options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function createSession(api: APIRequestContext, definitionId: "sanctuaire-jardins-eternels" | "gouffre-gigalodon") {
  const response = await apiPost(api, "/api/sessions", { data: { definitionId, name: definitionId.includes("gigalodon") ? "Expédition Nacre" : "Raid du vendredi", language: "fr" } });
  expect(response.ok).toBeTruthy();
  return response.json() as Promise<{ session: { id:string }; invites:Record<string,{token:string;urlPath:string}> }>;
}

async function join(api: APIRequestContext, token:string,name:string):Promise<Identity> {
  const response=await apiPost(api,"/api/join",{data:{inviteToken:token,displayName:name}});
  expect(response.ok).toBeTruthy();
  return response.json();
}

function headers(identity:Identity){return {"x-participant-id":identity.participant.id,"x-recovery-token":identity.recoveryToken};}

async function command(api: APIRequestContext, identity:Identity,data:Record<string,unknown>){
  const response=await apiPost(api,`/api/sessions/${identity.sessionId}/commands`,{headers:headers(identity),data});
  const text=await response.text();
  expect(response.ok,text).toBeTruthy();
  return JSON.parse(text) as {result:Record<string,unknown>};
}

async function seedLobby(api: APIRequestContext) {
  const created=await createSession(api,"sanctuaire-jardins-eternels");
  const captain=await join(api,created.invites.CAPTAIN.token,"Maëlle");
  const editor=await join(api,created.invites.EDITOR.token,"Aya");
  const participants:Identity[]=[];
  for(const name of ["Lina","Malik","Sora","Noé","Kelyan","Yuna"]) participants.push(await join(api,created.invites.PARTICIPANT.token,name));
  const teamNames=["Escouade Belladone","Escouade Églantine","Escouade Galerie","Finales"];
  const teamIds:string[]=[];
  for(const name of teamNames){const result=await command(api,captain,{type:"CREATE_TEAM",name});teamIds.push(result.result.id as string);}
  for(const [index,identity] of [captain,editor,...participants].entries()){
    await command(api,captain,{type:"ASSIGN_PARTICIPANT_TEAM",participantId:identity.participant.id,teamId:teamIds[Math.floor(index/2)%teamIds.length]});
    if(index<6) await command(api,captain,{type:"SET_READY",participantId:identity.participant.id,ready:true});
  }
  return {sessionId:created.session.id,captain};
}

async function seedLive(api: APIRequestContext, definitionId:"sanctuaire-jardins-eternels"|"gouffre-gigalodon") {
  const created=await createSession(api,definitionId);
  const captain=await join(api,created.invites.CAPTAIN.token,"Capitaine Maëlle");
  const editor=await join(api,created.invites.EDITOR.token,"Aya");
  const participants:Identity[]=[];
  for(const name of ["Lina","Nox","Yuna","Malik","Sora","Noé"]) participants.push(await join(api,created.invites.PARTICIPANT.token,name));
  for(const identity of [captain,editor,...participants]) await command(api,captain,{type:"SET_READY",participantId:identity.participant.id,ready:true});
  await command(api,captain,{type:"START_SESSION"});
  if(definitionId==="gouffre-gigalodon"){
    await command(api,captain,{type:"ADJUST_GIGALODON_SALT",delta:24,cause:"Collecte visuelle",responsibleParticipantId:participants[1]!.participant.id});
    await command(api,captain,{type:"SET_GIGALODON_LIGHT",floor:-1,level:2,intervalSeconds:120,intervalSourceStatus:"GUIDE_CONFIRMED",saltCostSourceStatus:"GUIDE_CONFIRMED",responsibleParticipantId:participants[1]!.participant.id});
    await command(api,participants[0]!,{type:"UPDATE_GIGALODON_INVENTORY",participantId:participants[0]!.participant.id,resources:{quartz:12,onyx:2,uniteMureine:1},currentFloor:-3,risk:"MEDIUM"});
  } else {
    await command(api,captain,{type:"ADJUST_RAID_LIFE",delta:-2,cause:"Erreur confirmée en jeu"});
  }
  return {sessionId:created.session.id,captain,participant:participants[0]!};
}

async function openSession(page:Page,sessionId:string,identity:Identity){
  await page.addInitScript(({id,actor})=>localStorage.setItem(`raidweave:${id}`,JSON.stringify({participantId:actor.participant.id,recoveryToken:actor.recoveryToken})),{id:sessionId,actor:identity});
  await page.goto(`/session/${sessionId}`);
  await page.evaluate(()=>document.fonts.ready);
}

async function expectNoHorizontalOverflow(page:Page){
  const sizes=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth+1);
}

async function expectNoSeriousAccessibilityViolations(page:Page){
  const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  const violations=result.violations.filter((violation)=>violation.impact==="critical"||violation.impact==="serious");
  expect(violations,JSON.stringify(violations,null,2)).toEqual([]);
}

test("landing visual authenticity · 1440",async({page},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop-1440");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.getByRole("heading",{name:/Le raid ne se gagne pas/})).toBeVisible();
  await expect(page.locator(".raid-poster")).toHaveCount(2);
  await expect(page.locator(".hero .card")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({path:"artifacts/phase8-5b-screens/landing-1440x900.png"});
});

test("session lobby visual authenticity · 1440",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop-1440");
  const seeded=await seedLobby(request);
  await openSession(page,seeded.sessionId,seeded.captain);
  await expect(page.getByTestId("lobby")).toBeVisible();
  await expect(page.locator(".formation-lane")).toHaveCount(4);
  await expect(page.locator(".ready-dial")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({path:"artifacts/phase8-5b-screens/session-lobby-1440x900.png"});
});

test("Sanctuaire captain visual authenticity · 1440",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop-1440");
  const seeded=await seedLive(request,"sanctuaire-jardins-eternels");
  await openSession(page,seeded.sessionId,seeded.captain);
  await expect(page.getByTestId("sanctuaire-command-center")).toBeVisible();
  await expect(page.locator(".puzzle-workbench")).toHaveCount(4);
  await expect(page.locator(".puzzle-transfer")).toHaveCount(4);
  await expect(page.locator(".garden-route")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({path:"artifacts/phase8-5b-screens/sanctuaire-captain-1440x900.png"});
});

test("Gigalodon captain visual authenticity · 1440, 768 and 1920",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop-1440");
  const seeded=await seedLive(request,"gouffre-gigalodon");
  await openSession(page,seeded.sessionId,seeded.captain);
  await expect(page.getByTestId("gigalodon-command-center")).toBeVisible();
  await expect(page.locator(".light-card")).toHaveCount(5);
  await expect(page.locator(".gigalodon-metrics")).toHaveCount(0);
  await expect(page.getByText(/encore portés/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({path:"artifacts/phase8-5b-screens/gigalodon-captain-1440x900.png"});
  for(const viewport of [{width:768,height:1024},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator(".depth-route")).toBeVisible();
  }
});

test("participant mission visual authenticity · 390",async({page,request},testInfo)=>{
  test.skip(testInfo.project.name!=="mobile-390");
  const seeded=await seedLive(request,"gouffre-gigalodon");
  await openSession(page,seeded.sessionId,seeded.participant);
  await expect(page.getByTestId("mission-view")).toBeVisible();
  const actionBox=await page.locator(".mission-order-actions .primary").boundingBox();
  expect(actionBox).not.toBeNull();
  expect((actionBox?.y??1000)+(actionBox?.height??0)).toBeLessThanOrEqual(620);
  await expect(page.locator(".mission-quick")).toHaveCount(2);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({path:"artifacts/phase8-5b-screens/participant-mobile-390x844.png"});
});

test("Accessibility · WCAG AA, focus and reduced motion",async({page,request},testInfo)=>{
  const mobile=testInfo.project.name==="mobile-390";
  const seeded=await seedLive(request,mobile?"gouffre-gigalodon":"sanctuaire-jardins-eternels");
  await page.emulateMedia({reducedMotion:"reduce"});
  await openSession(page,seeded.sessionId,mobile?seeded.participant:seeded.captain);
  await expectNoSeriousAccessibilityViolations(page);
  await page.keyboard.press("Tab");
  const focused=await page.evaluate(()=>document.activeElement?.matches(":focus-visible")??false);
  expect(focused).toBeTruthy();
  const motion=await page.locator("body").evaluate((element)=>getComputedStyle(element).animationDuration);
  expect(motion==="0s"||motion==="").toBeTruthy();
});
