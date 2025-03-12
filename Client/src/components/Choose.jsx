import Join from "./Join";
import JoinPTP from "./JoinPTP";
const Choose = () => {
  return (
    <div className="flex flex-wrap bg-gradient-to-br from-indigo-100 to-purple-100 h-screen items-center justify-center">
      {/* <h1 className="text-3xl font-bold text-indigo-800">Choose a page</h1> */}
    <Join />
    <JoinPTP />
    </div>
  );
}
export default Choose;