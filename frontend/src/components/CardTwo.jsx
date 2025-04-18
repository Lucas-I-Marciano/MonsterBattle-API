import { useEffect, useReducer, useState } from "react";
import { socket } from "../socket";

const reducer = (state, action) => {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        bg: "bg-gray-300 text-white",
        disabled: true,
      };
    case "back":
      return {
        ...state,
        bg: "bg-gray-900",
        disabled: false,
      };
    default:
      return state;
  }
};

export const CardTwo = ({ img, name, hp, attack, defense, speed, actions }) => {
  return (
    <div className="max-w-2xl mx-4 sm:max-w-sm md:max-w-sm lg:max-w-sm xl:max-w-sm sm:mx-auto md:mx-auto lg:mx-auto xl:mx-auto mt-8 bg-white shadow-xl rounded-lg text-gray-900">
      <div className="rounded-t-lg h-32 overflow-hidden">
        <img
          className="object-cover object-top w-full"
          src="https://images.unsplash.com/photo-1549880338-65ddcdfd017b?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjE0NTg5fQ"
          alt="Mountain"
        />
      </div>
      <div className="mx-auto w-32 h-32 relative -mt-16 border-4 border-white rounded-full overflow-hidden">
        <img
          className="object-cover object-center h-32"
          src={img}
          alt="Monster"
        />
      </div>
      <div className="text-center mt-10">
        <h2 className="font-semibold text-red-600 text-xl">{name}</h2>
      </div>
      <ul className="py-4 mt-10 text-gray-700 flex items-center justify-around text-red-600">
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-red-800 font-bold">Hp</span>
          <div className="text-center">{hp}</div>
        </li>
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-red-800 font-bold">Atk</span>
          <div className="text-center">{attack}</div>
        </li>
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-red-800 font-bold">Def</span>
          <div className="text-center">{defense}</div>
        </li>
        <li className="flex flex-col items-center justify-center">
          <span className="fill-current text-red-800 font-bold">Speed</span>
          <div className="text-center">{speed}</div>
        </li>
      </ul>
    </div>
  );
};
