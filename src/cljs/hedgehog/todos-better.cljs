(ns hedgehog.todos
  (:use-macros [hedgehog.macros :only [defco defstate defevents defpartial]])
  (:require [hedgehog.core :as hh]))

;; application state
(defstate
  {:todos ["buy milk" "eat lunch" "drink milk"]
   :pending {:todo "foo bar"}})

;; COs based on data state
(defco :first-todo (first (hh/get :todos)))
(defco :num-todos (count (hh/get :todos)))

;; application logic
(defn add-pending-todo! []
  (hh/add! :todos (get :todo :pending))
  (hh/clear! :todo :pending))

;; html templates
(defn todo-element [todo]
  [:li.todo todo])

(defpartial todos
  [:title (hh/bind! :pending-todo)]
  [:div#todos
     [:h1 (str "Todos (" (hh/bind! :num-todos) ")")]
     [:ul (map todo-element :todos)
      [:input#input
       {:value (bind! :todo :pending) :type "text"}]
      [:button "Add"
       {:click add-pending-todo!}]
      [:span (hh/bind! :todo :pending)]]])

(hh/init! todos)