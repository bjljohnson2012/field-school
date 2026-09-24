export function ThemeScript() {
  const code = `(function(){try{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
