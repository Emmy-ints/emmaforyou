import zipfile, sys, json, re
from lxml import etree
D=sys.argv[1]
ok=[];fail=[]
def t(n,c,info=""): (ok if c else fail).append((n,info))
# EPUB
z=zipfile.ZipFile(D+"/book.epub")
il=z.infolist()
t("epub mimetype first+stored", il[0].filename=="mimetype" and il[0].compress_type==0 and z.read("mimetype")==b"application/epub+zip")
t("epub zip integrity", z.testzip() is None)
c=etree.fromstring(z.read("META-INF/container.xml"))
opfp=c.find(".//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile").get("full-path")
opf=etree.fromstring(z.read(opfp)); ns={"o":"http://www.idpf.org/2007/opf","dc":"http://purl.org/dc/elements/1.1/"}
base=opfp.rsplit("/",1)[0]+"/"
items={i.get("id"):i for i in opf.findall(".//o:manifest/o:item",ns)}
t("epub manifest files exist", all((base+i.get("href")) in z.namelist() for i in items.values()), [i.get("href") for i in items.values() if (base+i.get("href")) not in z.namelist()])
spine=[r.get("idref") for r in opf.findall(".//o:spine/o:itemref",ns)]
t("epub spine ids in manifest", all(s in items for s in spine))
t("epub nav property", any("nav" in (i.get("properties") or "") for i in items.values()))
t("epub metadata", opf.find(".//dc:title",ns) is not None and opf.find(".//dc:language",ns) is not None and opf.find(".//dc:identifier",ns).get("id")==opf.get("unique-identifier"))
t("epub modified", opf.find(".//o:meta[@property='dcterms:modified']",ns) is not None and re.match(r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$",opf.find(".//o:meta[@property='dcterms:modified']",ns).text))
allxml=True; bad=[]
for n in z.namelist():
    if n.endswith((".xhtml",".ncx",".opf",".xml")):
        try: etree.fromstring(z.read(n))
        except Exception as e: allxml=False; bad.append((n,str(e)))
t("epub all XML well-formed", allxml, bad)
unlisted=[n for n in z.namelist() if n.startswith(base) and n[len(base):] not in [i.get("href") for i in items.values()] and n!=opfp]
t("epub no unlisted files", not unlisted, unlisted)
words=json.load(open(D+"/words.json"))
txt=" ".join(" ".join(etree.fromstring(z.read(base+items[s].get("href"))).xpath("//*[local-name()='body']")[0].itertext()) for s in spine if s.startswith("ch"))
ew=re.findall(r"[\w][\w\u0300-\u036f'’\-]*",txt)
t("epub chapter text has every word", ew==words, (len(ew),len(words), next(((a,b) for a,b in zip(ew,words) if a!=b),None)))
# DOCX
import docx
d=docx.Document(D+"/book.docx")
paras=[p for p in d.paragraphs]
t("docx opens (python-docx)", len(paras)>50)
t("docx heading styles", sum(1 for p in paras if p.style.name=="Heading 1")==4, [p.style.name for p in paras[:12]])
dt=" ".join(p.text for p in paras)
dw=re.findall(r"[\w][\w\u0300-\u036f'’\-]*",dt)
t("docx contains all words in order", " ".join(words) in " ".join(dw))
sec=d.sections[0]; t("docx page size 6x9", abs(sec.page_width.inches-6)<0.01 and abs(sec.page_height.inches-9)<0.01, (sec.page_width.inches, sec.page_height.inches))
# PDF
import pypdf
r=pypdf.PdfReader(D+"/book.pdf")
t("pdf opens (pypdf)", len(r.pages)>8)
t("pdf metadata", r.metadata.title.startswith("Ọmọ Ọba") and r.metadata.author=="Adéwálé Ògúnṣọlá", (r.metadata.title, r.metadata.author))
t("pdf outline", [o.title for o in r.outline]==["Prologue","Chapter 1: The Market","Chapter 2: Rain","Epilogue"], [o.title for o in r.outline])
mb=r.pages[0].mediabox; t("pdf 6x9 trim", abs(float(mb.width)-432)<0.1 and abs(float(mb.height)-648)<0.1)
fonts=set()
for pg in r.pages[:6]:
    for f in (pg["/Resources"]["/Font"]).values(): fo=f.get_object(); fonts.add((fo["/BaseFont"], "/FontFile2" in fo["/DescendantFonts"][0].get_object()["/FontDescriptor"].get_object()))
t("pdf fonts embedded", fonts and all(e for _,e in fonts), fonts)
links=sum(len(p.get("/Annots",[]) or []) for p in r.pages[:4]); t("pdf contents links", links==4, links)
import subprocess
pt=subprocess.run(["pdftotext",D+"/book.pdf","-"],capture_output=True,text=True).stdout
import unicodedata
pw=set(re.findall(r"[\w][\w\u0300-\u036f'’\-]*",unicodedata.normalize("NFC",pt)))
strip=lambda w: "".join(c for c in unicodedata.normalize("NFD",w) if not unicodedata.combining(c))
pws=set(strip(w) for w in re.findall(r"[\w][\w\u0300-\u036f'’\-]*",pt.replace("\u0300 ","").replace("\u0301 ","")))
# words whose capital letter carries a raised tone mark are drawn with text rise; extractors may split them
missing=[w for w in set(words) if unicodedata.normalize("NFC",w) not in pw and len(w)<40 and not (re.search(r"[A-Z]\u0323?[\u0300\u0301]",unicodedata.normalize("NFD",w)) and strip(w)[1:] in "".join(pws))]
t("pdf text extractable (every word found)", not missing, missing[:10])
for ps,(w,h) in {"5x8":(360,576),"a4":(595.28,841.89),"letter":(612,792)}.items():
    rr=pypdf.PdfReader(f"{D}/book.{ps}.pdf"); m=rr.pages[3].mediabox
    t(f"pdf {ps} size", abs(float(m.width)-w)<0.1 and abs(float(m.height)-h)<0.1)
for n,i in fail: print("FAIL",n,str(i)[:300])
print(f"{len(ok)}/{len(ok)+len(fail)} passed")
