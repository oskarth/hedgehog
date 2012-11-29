(defproject hedgehog "0.1.0-SNAPSHOT"
  :description "web app dsl / cljs playground"
  :url "https://github.com/oskarth/hedgehog"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :plugins [[lein-cljsbuild "0.2.9"]
            [lein-ring "0.7.5"]]
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/clojurescript "0.0-1450"]
                 [compojure "1.1.0"]
                 [ring/ring-jetty-adapter "1.1.1"]
                 [com.keminglabs/reflex "0.1.1"]
                 [crate "0.2.1"]]
  :ring {:handler hedgehog.core/handler}
  :source-paths ["src/clj"]
  :cljsbuild {:builds [{:source-path "src/cljs"
                        :compiler {:output-to "resources/public/client.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]})